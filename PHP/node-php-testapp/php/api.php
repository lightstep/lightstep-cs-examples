<?php

require __DIR__ . "/vendor/autoload.php";

LightStep::initGlobalTracer("php-server", "<access-token>",
);


//$span = LightStep::startSpan("server_span");
$span = LightStep::getInstance()->join("server_span", "LIGHTSTEP_FORMAT_TEXT_MAP", getallheaders());

// get the HTTP method, path and body of the request
$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'],'/'));
$input = json_decode(file_get_contents('php://input'),true);

$span->setTag("method", $method);
$span->setTag("request", $request);
$span->logEvent($input);
 
// connect to the mysql database
$link = mysqli_connect('localhost:3306', 'lightstep', 'lightstep', 'lightstep');
mysqli_set_charset($link,'utf8');

$child_span = LightStep::startSpan("mysql_init", array('parent' => $span));
$child_span->setTag("db.type", "mysql");

// Initialize Table on first time, subsequent will fail
$child_span->logEvent("initializing table", $input);
$sqlinit = "create table orders (id int);";
$child_span->setTag("query", $sqlinit);
$result = mysqli_query($link,$sqlinit);

if (!$result) {
  $child_span->setTag('error', "true");
}
$child_span->finish();
 
// retrieve the table and key from the path
$table = preg_replace('/[^a-z0-9_]+/i','',array_shift($request));
$key = array_shift($request)+0;
$span->setTag("table", $table);
$span->setTag("key", $key);
 
// escape the columns and values from the input object
if ($input) {
  $span->logEvent("payload", $input);
  $columns = preg_replace('/[^a-z0-9_]+/i','',array_keys($input));
  $values = array_map(function ($value) use ($link) {
    if ($value===null) return null;
    return mysqli_real_escape_string($link,(string)$value);
  },array_values($input));
   
  // build the SET part of the SQL command
  $set = '';
  for ($i=0;$i<count($columns);$i++) {
    $set.=($i>0?',':'').'`'.$columns[$i].'`=';
    $set.=($values[$i]===null?'NULL':'"'.$values[$i].'"');
  }  
}

// create SQL based on HTTP method
switch ($method) {
  case 'GET':
    $sql = "select * from `$table`".($key?" WHERE id=$key":''); break;
  case 'PUT':
    $sql = "update `$table` set $set where id=$key"; break;
  case 'POST':
    $sql = "insert into `$table` set $set"; break;
  case 'DELETE':
    $sql = "delete `$table` where id=$key"; break;
}


$child2_span = LightStep::startSpan("mysql_query", array('parent' => $span));
$child2_span->setTag("query", $sql);
$child2_span->logEvent("starting query to mysql"); 
// excecute SQL statement
$result = mysqli_query($link,$sql);
$child2_span->logEvent("received result from mysql"); 
// die if SQL statement failed
if (!$result) {
  http_response_code(404);
  $child2_span->setTag("error", "true");
  die(mysqli_error());
}
$child2_span->finish();

// print results, insert id or affected row count
if ($method == 'GET') {
  if (!$key) echo '[vendor/';
  for ($i=0;$i<mysqli_num_rows($result);$i++) {
    echo ($i>0?',':'').json_encode(mysqli_fetch_object($result));
  }
  if (!$key) echo ']';
} elseif ($method == 'POST') {
  echo mysqli_insert_id($link);
} else {
  echo mysqli_affected_rows($link);
}

$span->finish();
 
// close mysql connection
mysqli_close($link);