import axios from 'axios'

const SERVER_HOST = process.env.SUPER_SERVER_HOST || 'localhost'
const SERVER_PORT = process.env.SUPER_SERVER_PORT || 4000

const api = axios.create({
  baseURL: `http://${SERVER_HOST}:${SERVER_PORT}/api`
})

export default api
