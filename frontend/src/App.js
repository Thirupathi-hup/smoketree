import {useState} from 'react'
import './App.css'

const App = () => {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [responseMessage, setResponseMessage] = useState('')

  const handleSubmit = async event => {
    event.preventDefault()
    const data = {name, address}

    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    setResponseMessage(result.message)
  }

  return (
    <div className="App">
      <h1>User Details</h1>
      <form onSubmit={handleSubmit} className="container">
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Address:
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit">submit</button>
      </form>
      <p>{responseMessage}</p>
    </div>
  )
}

export default App
