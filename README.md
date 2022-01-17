# Social Media

This is a simple REST API for a social media app made with Nodejs.

Live link - https://r-social-media-api.herokuapp.com/

Sample User credentials for the Live version:

		User1:
		username- abc@xyz.com
		password- secret

		User2:
		username- def@xyz.com
		password- secret1

## How to Run

Make sure a local postgresql server is running.
Clone this repository and create a file named `.env` and paste in the following:

  DATABASE_URL="postgresql://\<username>:\<password>@localhost:\<port>/\<database>"

Replace username, passwords, port and database with their respective values.

While in the root directory run the following commands:

    $ npm install
    $ npm run dev


## Schema

![image](https://user-images.githubusercontent.com/44289954/149773396-ae03365f-a513-4bbb-b89c-69e2acb8ba3b.png)
