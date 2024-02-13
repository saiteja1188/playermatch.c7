const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const inititaizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

inititaizeDbAndServer()

const converToResponseObj = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  }
}

const converMatchDetailsTOResponseObj = newObj => {
  return {
    mathcId: newObj.match_id,
    match: newObj.match,
    year: newObj.year,
  }
}

// List of all the players in the player table

app.get('/players/', async (request, response) => {
  const getAllPlayersArray = `
    SELECT
        *
    FROM
        player_details;
    `
  const listOfPlyers = await db.all(getAllPlayersArray)
  response.send(listOfPlyers.map(dbObj => converToResponseObj(dbObj)))
})

// Specific player based on the player ID

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getSinglePlayer = `
  SELECT 
    *
  FROM
    player_details
  WHERE
    player_id = ${playerId};
  `
  const playerDetails = await db.get(getSinglePlayer)
  response.send(converToResponseObj(playerDetails))
})

// Updates the details of a specific player

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayer = `
  UPDATE
    player_details
  SET
    player_name = "${playerName}"
  WHERE 
    player_id = ${playerId};
  `
  await db.run(updatePlayer)
  response.send('Player Details Updated')
})

// match details of a specific match

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const matchDetailsspecific = `
  SELECT 
    match_id As matchId,
    match,
    year
  FROM
    match_details
  WHERE
    match_id = ${matchId};
  `
  const matchDetails = await db.get(matchDetailsspecific)
  response.send(matchDetails)
})

// list of all the matches of a player

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const playeMatchDetails = `
  SELECT
    match_id As matchId,
    match,
    year
  FROM
    player_match_score NATURAL JOIN match_details
  WHERE
    player_id = ${playerId};
  `
  const playerMatch = await db.all(playeMatchDetails)
  response.send(playerMatch)
})

//  list of players of a specific match

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const matchplayerDetails = `
  SELECT
    *
  FROM 
    player_match_score NATURAL JOIN player_details
  WHERE 
    match_id = ${matchId}
  `
  const matchPlayers = await db.all(matchplayerDetails)
  response.send(matchPlayers.map(obj => converToResponseObj(obj)))
})

// the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const playerStatistics = `
  SELECT
    player_id As playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
  FROM 
    player_match_score NATURAL JOIN player_details
  WHERE
    player_id = ${playerId}
  `
  const statisticsOfplayer = await db.get(playerStatistics)
  response.send(statisticsOfplayer)
})

module.exports = app
