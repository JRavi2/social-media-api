const Pool = require("pg").Pool;
const jwt = require("jsonwebtoken");
const uuid = require("uuid");

// Create a pool of connections
const pool = new Pool({
  user: "host",
  host: "localhost",
  database: "postgres",
  password: "secret",
  port: 5432,
});

// Middleware to authenticate the requests
const auth = async (req, res, next) => {
  try {
    // req.header("Authorization") will return "Bearer *the token*" so we have to remove "Bearer "
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "thisisjwt");
    const results = await pool.query("SELECT * FROM Users WHERE id=$1 AND $2=Any(tokens)", [decoded.id, token]);

    if (results.rows.length == 0) throw new Error();

    req.token = token;
    req.user = results.rows[0];
    next();
  } catch (err) {
    res.status(401).send({ error: "Invalid authentication!" });
  }
};

// Generate token
const authenticate = async (req, res) => {
  try {
    const { email, password } = req.body;

    const results = await pool.query("SELECT * FROM Users WHERE email=$1 AND password=$2", [email, password]);

    if (results.rows.length == 0) {
      throw new Error({
        error: "Unable to login (Invalid Username or Password)",
      });
    }

    const user = results.rows[0];
    console.log(user);
    const token = jwt.sign({ id: user.id.toString() }, "thisisjwt");

    if (user.tokens == null) {
      user.tokens = [];
    }
    user.tokens = user.tokens.concat(token);
    await pool.query("UPDATE Users SET tokens=$1 WHERE id = $2", [user.tokens, user.id]);

    res.status(200).json(token);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

// Follow a user
const follow = async (req, res) => {
  try {
		const following_user = req.user.id, followed_user = req.params.id;

    const follows = await pool.query("SELECT * FROM follows WHERE following_user=$1 AND followed_user=$2", [following_user, followed_user]);

    if (follows.rows.length != 0) {
			return res.status(400).send();
    }

		await pool.query("INSERT INTO follows (following_user, followed_user) VALUES ($1, $2)", [following_user, followed_user]);
    await pool.query("UPDATE users SET following=following+1 WHERE id = $1", [following_user]);
    await pool.query("UPDATE users SET followers=followers+1 WHERE id = $1", [followed_user]);

    res.status(200).send();
  } catch (err) {
		console.log(err);
    res.status(400).send(err);
  }
}

// Unfollow a user
const unfollow = async (req, res) => {
  try {
		const following_user = req.user.id, followed_user = req.params.id;

    const follows = await pool.query("SELECT * FROM follows WHERE following_user=$1 AND followed_user=$2", [following_user, followed_user]);

    if (follows.rows.length == 0) {
			return res.status(400).send();
    }

		await pool.query("DELETE FROM follows WHERE following_user=$1 AND followed_user=$2", [following_user, followed_user]);
    await pool.query("UPDATE users SET following=following-1 WHERE id = $1", [following_user]);
    await pool.query("UPDATE users SET followers=followers-1 WHERE id = $1", [followed_user]);

    res.status(200).send();
  } catch (err) {
		console.log(err);
    res.status(400).send(err);
  }
}

// Fetch the authenticated user's data
const getUser = async (req, res) => {
  try {
		const userdata = (({ username, followers, following }) => ({ username, followers, following }))(req.user);

    res.status(200).json(userdata);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

// Create a Post
const createPost = async (req, res) => {
  try {
    const { title, description } = req.body;
    const timestamp = Date.now() / 1000;
    const post_id = uuid.v4();

    await pool.query(
      "INSERT INTO Posts (post_id, title, description, created_at, author_id) VALUES ($1, $2, $3, to_timestamp($4), $5)",
      [post_id, title, description, timestamp, req.user.id]
    );

    res.status(200).json({ post_id, title, description, created_at: timestamp });
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

// Delete a Post created by the authenticated user
const deletePost = async (req, res) => {
  try {
    const post_id = req.params.id;
    await pool.query("DELETE FROM posts WHERE post_id=$1 AND author_id=$2", [post_id, req.user.id]);

    res.status(200).send();
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

// Like a Post
const likePost = async (req, res) => {
  try {
		const user_id = req.user.id, post_id=req.params.id;

    const liked = await pool.query("SELECT * FROM likes WHERE user_id=$1 AND post_id=$2", [user_id, post_id]);

    if (liked.rows.length != 0) {
			return res.status(400).send();
    }

		await pool.query("INSERT INTO likes (user_id, post_id) VALUES ($1, $2)", [user_id, post_id]);
    await pool.query("UPDATE posts SET likes=likes+1 WHERE post_id = $1", [post_id]);

    res.status(200).send();
  } catch (err) {
		console.log(err);
    res.status(400).send(err);
  }
}

// Unlike a Post
const unlikePost = async (req, res) => {
  try {
		const user_id = req.user.id, post_id=req.params.id;

    const liked = await pool.query("SELECT * FROM likes WHERE user_id=$1 AND post_id=$2", [user_id, post_id]);

    if (liked.rows.length == 0) {
			return res.status(400).send();
    }

		await pool.query("DELETE FROM likes WHERE user_id=$1 AND post_id=$2", [user_id, post_id]);
    await pool.query("UPDATE posts SET likes=likes-1 WHERE post_id = $1", [post_id]);

    res.status(200).send();
  } catch (err) {
		console.log(err);
    res.status(400).send(err);
  }
}

// Comment on a Post
const comment = async (req, res) => {
  try {
    const post_id = req.params.id;
    const { comment } = req.body;
    const comment_id = uuid.v4();

    await pool.query("INSERT INTO comments (comment_id, comment, post_id, author_id) VALUES ($1, $2, $3, $4)", [
      comment_id,
      comment,
      post_id,
      req.user.id,
    ]);

		await pool.query("UPDATE posts SET comments=comments+1 WHERE post_id=$1", [post_id]);

    res.status(200).send({ comment_id });
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

// Fetch a Single Post
const getSinglePost = async (req, res) => {
  try {
    const post_id = req.params.id;

    const results = await pool.query("SELECT * FROM Posts WHERE post_id=$1", [post_id]);

    if (results.rows.length == 0) {
      return res.status(404).send();
    }

    const post = results.rows[0];

    res.status(200).json(post);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

// Get all Posts of the authenticated user
const getAllPosts = async (req, res) => {
  try {
    const results = await pool.query("SELECT * FROM Posts WHERE author_id=$1 ORDER BY created_at", [req.user.id]);

    if (results.rows.length == 0) {
      return res.status(404).send();
    }

    res.status(200).json(results.rows);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

module.exports = {
  auth,
  authenticate,
	follow,
	unfollow,
	getUser,
  createPost,
  deletePost,
	likePost,
	unlikePost,
  comment,
  getSinglePost,
	getAllPosts
};
