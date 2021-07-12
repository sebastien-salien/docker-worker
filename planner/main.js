require('dotenv').config()
const fetch = require('node-fetch')
const nbTasks = parseInt(process.env.TASKS) || 20

const randInt = (min, max) => Math.floor(Math.random() * (max - min)) + min
const taskType = () => (randInt(0, 2) ? 'mult' : 'add')
const args = () => ({ a: randInt(0, 40), b: randInt(0, 40) })
const port = process.env.PORT
const generateTasks = i =>
  new Array(i).fill(1).map(_ => ({ type: taskType(), args: args() }))

const CONST_ADD= ['http://172.18.0.1:8080','http://172.18.0.1:8081','http://172.18.0.1:8082','http://172.18.0.1:8083']
const CONST_MULT= ['http://172.18.0.1:8084','http://172.18.0.1:8085','http://172.18.0.1:8086','http://172.18.0.1:8087']

let workers = [...CONST_ADD,...CONST_MULT]
let tasks = generateTasks(nbTasks)
let taskToDo = nbTasks

const wait = mili => new Promise((resolve, reject) => setTimeout(resolve, mili))

const sendTask = async (worker, task) => {
  console.log(`${worker}/${task.type}`, task)
  workers = workers.filter(w => w !== worker)
  tasks = tasks.filter(t => t !== task)
  const request = fetch(`${worker}/${task.type}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task.args),
  })
    .then(res => {
      workers = [...workers, worker]
      return res.json()
    })
    .then(res => {
      taskToDo -= 1
      console.log(task, 'has res', res)
      return res
    })
    .catch(err => {
      console.log(task, ' failed')
      tasks = [...tasks, task]
    })
}

const main = async () => {
  console.log(tasks)
  while (taskToDo > 0) {
    await wait(100)
    if (workers.length === 0 || tasks.length === 0) continue
    if(tasks.type == 'mult'){
      const  mult_worker = workers.find(w => CONST_MULT.includes(w)) 
      if(!mult_worker) continue 
      sendTask(mult_worker, tasks[0])
    }else{
      const  mult_worker = workers.find(w => CONST_ADD.includes(w)) 
      if(!mult_worker) continue 
      sendTask(mult_worker, tasks[0])
    }
    
  }
}

main()
