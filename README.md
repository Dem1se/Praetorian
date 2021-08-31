# Praetorian
Build exclusive communities with this bot for email-verifying new server members, before giving them access to the server. The email has to belong to a set of specific configurable domains.

It was made to be used by communities like college gaming discord servers / esports teams, etc. but can obviously can be used for other purposes.

## Invite
Invite link *with* admin permission [here](https://discord.com/api/oauth2/authorize?client_id=835201049701646336&permissions=8&scope=bot) is recommended for the best experience.

Admin permission is required for the setup, and configure autoverifyall commands only.

## Commands
`verify`, `code`, `help`, `setup`, `configure`

Use the `!help` command to get an up to date explaination on these commands

## `.env` File
The .env file at the root of the project needs to have the following variables.
```env
BOT_TOKEN=""
EMAIL_ID=""
EMAIL_PWD=""
```
