const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const db = require("./queries");
const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (request, response) => {
  response.json({ info: "Ping!" });
});

app.post("/api/authenitcate", db.authenticate);
app.post('/api/follow/:id', db.auth, db.follow)
app.post('/api/unfollow/:id', db.auth, db.unfollow)
app.get('/api/user', db.auth, db.getUser)
app.post("/api/posts", db.auth, db.createPost);
app.delete("/api/posts/:id", db.auth, db.deletePost);
app.post('/api/like/:id', db.auth, db.likePost)
app.post('/api/unlike/:id', db.auth, db.unlikePost)
app.post("/api/comment/:id", db.auth, db.comment);
app.get("/api/posts/:id", db.getSinglePost);
app.get("/api/all_posts", db.auth, db.getAllPosts);

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}.`);
});
