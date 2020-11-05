db.createUser({
  user: "lightstep",
  pwd: "lightstep",
  roles: [
    {
      role: "readWrite",
      db: "lightstep",
    },
  ],
});
