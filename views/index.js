import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const maxPosts = 20;
const app = express();
const blogs = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "blogs",
    password: "123456789",
    port: 5433
});
blogs.connect();


const port = 3000;

let blogRows = await getBlogs(maxPosts);





let signed_in = false;
let username;
let password;
let name;

async function getBlogs(maxPosts) {
  
    const results = await blogs.query('SELECT * FROM blogs LIMIT $1', [maxPosts]);


    if (results.rows.length > 0) {
        return results.rows;
    }
    return []; 

    
}







app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static('public'));


app.get("/", async (req, res) =>{
    
    let blogRows = await getBlogs(maxPosts, res);
    
    res.render("index.ejs", {blogRows});
});

app.post('/submit', async  (req,res) =>{
    const authorId = username;
    const blogDate = new Date().toLocaleString('en-US');
    const blogTitle = req.body["title"];
    const blogText = req.body["blogText"];
    let name;


    let results = await blogs.query('SELECT name FROM users WHERE user_id = \$1', [authorId]);
        
    if (results.rows.length > 0) {
        name = results.rows[0].name;
    }
    await blogs.query('INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) VALUES (\$1, \$2, \$3, \$4, \$5)', [name, authorId, blogTitle, blogText, blogDate]);
        
    let blogRows = await getBlogs(maxPosts);
    res.render('index.ejs', {signed_in: true, username, blogRows});

});

app.post('/delete', async (req,res) =>{
    const id =  req.body.deleteId;

    await blogs.query('DELETE FROM blogs WHERE blog_id = \$1', [id]);
       
    let blogRows = await getBlogs(maxPosts);
    res.render('index.ejs', {signed_in: true, username, blogRows});
   
});

app.post('/save', async (req,res) =>{
    const authorId = req.body["creator_user_id"];
    const blogDate = new Date().toLocaleString('en-US');
    const blogTitle = req.body["title"];
    const blogText = req.body["blogText"];
    const id = req.body["blog_id"];
    name = req.body["creator_name"]
    
    
    await blogs.query(
    'UPDATE blogs SET creator_name = $1, creator_user_id = $2, title = $3, body = $4, date_created = $5 WHERE blog_id = $6', [name, authorId, blogTitle, blogText, blogDate, Number(id)]
    ); 
    

    let blogRows = await getBlogs(maxPosts);
    res.render('index.ejs', {signed_in: true, username, blogRows});
});

app.post('/edit', async (req,res) =>{
        // 1. Find the specific blog post safely
    const postID = req.body.postId;
    
    const matchedBlog = blogRows.find(row => row.blog_id === Number(postID));
    console.log(postID);
    // 2. Handle the case where the post is found
    if (matchedBlog) {
        
        return res.render("edit.ejs", { blog: matchedBlog });
    }

    return res.status(404).send("Blog post not found");
});

app.get('/sign_up', async (req,res) =>{
    res.render("sign_up.ejs");
});

app.get('/sign_in', async (req,res) =>{
    res.render("sign_in.ejs");
});

app.get('/exit', async (req,res) =>{
    let blogRows = await getBlogs(maxPosts);
    res.render("index.ejs", {signed_in, username, blogRows});
});

app.get('/create_page', async (req,res) =>{
    res.render("create_post.ejs");
});

app.get('/logout', async (req,res) =>{
    signed_in = false;
    username = "";
    password = "";
    res.render("index.ejs", {signed_in, blogRows});
});

app.post('/submitSign_up', async (req,res) =>{
    username = req.body['username'];
    password = req.body['password'];
    let name = req.body['name'];

    let results = await blogs.query('SELECT * FROM users WHERE user_id = \$1',[username]);
   

    // Check whether the username already exists
    if (results.rows.length > 0) {
        
        res.render('sign_up.ejs', {invalid_user: true});
        return;
    }

    // Username doesn't exist, so create the account
    await blogs.query('INSERT INTO users VALUES (\$1, \$2, \$3)',[username, password, name])
        
    signed_in = true;
    let blogRows = await getBlogs(maxPosts);
    res.render('index.ejs', {invalid_user: false, signed_in, username, blogRows});
        
   
});

app.post('/submitSign_in', async (req,res) =>{
    username = req.body['username'];
    password = req.body['password'];

    let results = await blogs.query('SELECT * FROM users WHERE user_id = \$1 AND password = \$2', [username, password]);
    
    // Check whether the user exists
    if (results.rows.length > 0) {
        signed_in = true;
        let blogRows = await getBlogs((maxPosts));
        res.render('index.ejs', {signed_in: true, username, blogRows});
        return;
        
    }
    
    res.render('sign_in.ejs', {invalid_user: true, signed_in: false});    
    
});



app.listen(port, () => {
    console.log(`server running on port ${port}.`);
})



