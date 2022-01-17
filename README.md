# Social Media

This is a simple REST API for a social media app made with Nodejs.

## How to Run

Make sure a local postgresql server is running.
Clone this repository and create a file named `.env` and paste in the following:

  DATABASE_URL="postgresql://\<username>:\<password>@localhost:\<port>/\<database>"
  
Replace username, passwords, port and database with their respective values.

While in the root directory run the following commands:

    $ npm install
    $ npm run dev
