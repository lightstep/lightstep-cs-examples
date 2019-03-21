package com.example.lightspeed;

import android.content.Context;
import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class MainActivity extends AppCompatActivity {

    EditText input;
    Button btn;

    OkHttpClient client = new OkHttpClient();
    String URL = "https://1ri3o12zf6.execute-api.us-east-1.amazonaws.com/development/users";


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        GetList okHttpHandler= new GetList();
        okHttpHandler.execute();


        input = findViewById(R.id.editText);
        btn = findViewById(R.id.button);
        btn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                String task = input.getText().toString();
                AddItem okHttpHandler= new AddItem();
                okHttpHandler.execute(task);
                input.setText("");
            }
        });


    }


    private class StableArrayAdapter extends ArrayAdapter<String> {

        HashMap<String, Integer> mIdMap = new HashMap<String, Integer>();

        public StableArrayAdapter(Context context, int textViewResourceId,
                                  List<String> objects) {
            super(context, textViewResourceId, objects);
            for (int i = 0; i < objects.size(); ++i) {
                mIdMap.put(objects.get(i), i);
            }
        }

        @Override
        public long getItemId(int position) {
            String item = getItem(position);
            return mIdMap.get(item);
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }

    }

    public class AddItem extends AsyncTask <String, Void, String> {


        @Override
        protected String doInBackground(String...params) {

            Request.Builder builder = new Request.Builder();
            Request request;

            MediaType mediaType = MediaType.parse("application/json");

            Random r = new Random();
            String id = Integer.toString(r.nextInt((2000 - 3) + 1));
            Log.d("id", id);

            String bodyString = ("{\n\t\"id\":" +
                    id +
                    ",\n\t\"firstName\": ") +
                    params[0] +
                    ",\n\t\"lastName\": \"Grewal\",\n\t\"color\": \"blue\"\n}";


            RequestBody body = RequestBody.create(mediaType, bodyString);
            builder.url(URL)
                    .post(body)
                    .addHeader("content-type", "application/json")
                    .build();
            request = builder.build();
            try {
                Response response = client.newCall(request).execute();
                return response.body().string();
            } catch (Exception e) {
                e.printStackTrace();
            }

            return null;
        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);
            Log.d("response", s);
            GetList okHttpHandler= new GetList();
            okHttpHandler.execute();

        }
    }


    public class GetList extends AsyncTask <String, Void, String> {


        @Override
        protected String doInBackground(String...params) {

            Request.Builder builder = new Request.Builder();
            Request request;

            builder.url(URL);
            request = builder.build();
            try {
                Response response = client.newCall(request).execute();
                return response.body().string();
            }catch (Exception e){
                e.printStackTrace();
            }

            return null;
        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);
            Log.d("response", s);


            try {
                JSONArray arr = new JSONArray(s);
                String[] values = new String[arr.length()];
                for (int i = 0; i < arr.length(); ++i ) {
                    values[i] = arr.getJSONObject(i).get("FirstName").toString();
                }

                final ListView listview = (ListView) findViewById(R.id.list_view);
                final ArrayList<String> list = new ArrayList<String>();
                for (int i = 0; i < values.length; ++i) {
                    list.add(values[i]);
                }
                final StableArrayAdapter adapter = new StableArrayAdapter(MainActivity.this,
                        android.R.layout.simple_list_item_1, list);
                listview.setAdapter(adapter);

                listview.setOnItemClickListener(new AdapterView.OnItemClickListener() {

                    @Override
                    public void onItemClick(AdapterView<?> parent, final View view,
                                            int position, long id) {
                        final String item = (String) parent.getItemAtPosition(position);
                        view.animate().setDuration(2000).alpha(0)
                                .withEndAction(new Runnable() {
                                    @Override
                                    public void run() {
                                        list.remove(item);
                                        adapter.notifyDataSetChanged();
                                        view.setAlpha(1);
                                    }
                                });
                    }

                });

            } catch (JSONException e) {

            }
        }
    }


}
