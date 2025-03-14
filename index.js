import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;
const key = "0f7e1eeb01e34246a68313ea587af7cb";

// Database connection setup
const db = new pg.Client({
user:"postgres",
host:"localhost",
database:"favorite_recipes",
password:"HS7725",
port:5432,
});

db.connect(); // Connect to the PostgreSQL database



app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Route: Home Page
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// Route: Display Saved Recipes
app.get("/saved-recipes", async(req, res) => {
  try{
    const result = await db.query("SELECT * FROM favorite_recipes");
    res.render("saved-recipes.ejs", {recipes:result.rows});
  }catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).send("Error fetching favorites");
  }
});

// Route: Save a Recipe to Database
app.post("/save-recipe", async (req, res) => {
  const { title, image, apiId } = req.body;

  try {
    // Check if the recipe is already saved
    const existingRecipe = await db.query(
      "SELECT * FROM favorite_recipes WHERE api_id = $1",
      [apiId]
    );

    if (existingRecipe.rows.length > 0) {
      // If recipe exists, redirect to saved recipes without inserting again
      res.redirect("/saved-recipes");
    } else {
      // Insert the recipe if it doesn't exist
      await db.query(
        "INSERT INTO favorite_recipes (title, image_url, api_id) VALUES ($1, $2, $3)",
        [title, image, apiId]
      );
      res.redirect("/saved-recipes");
    }
  } catch (error) {
    console.error("Error saving recipe:", error);
    res.status(500).send("Error saving recipe");
  }
});

// Route: Delete a Recipe from Database
app.post("/delete-recipe/:id", async (req, res) => {
const recipeId = req.params.id;
await db.query("DELETE FROM favorite_recipes WHERE id = $1", [recipeId]);
res.redirect("/saved-recipes");
});

// Route: Fetch Random Recipes for Search Page
app.get("/search", async (req, res) => {
  try {
      const response = await axios.get(`https://api.spoonacular.com/recipes/random?number=10&apiKey=${key}`);
      res.render("search.ejs", { recipes: response.data.recipes });
  } catch (error) {
      console.error("Error fetching recipes:", error);
      res.render("search.ejs", { recipes: [] });
  }
});

// Route: Search Recipes by Keyword
app.post("/search", async(req,res) =>{
  const {query} = req.body;
  try{
      const response = await axios.get(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&apiKey=${key}`);
      const recipes = response.data.results;
      res.render("results.ejs", {recipes});
  }catch (error) {
      console.error("Error fetching recipes:", error.response ? error.response.data : error.message);
      res.send("An error occurred while fetching recipes. Please try again later.");
  }

});

// Route: View Detailed Recipe
app.get("/recipe/:id", async (req, res) => {
  const recipeId = req.params.id;
  try {
    const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${key}`);
    const recipe = response.data;
    res.render("view-recipe.ejs", { recipe });
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.status(500).send("Error fetching recipe details");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
  