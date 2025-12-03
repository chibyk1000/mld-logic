import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.jpeg"
import { useState } from "react";

const Login = () => {
 const navigate = useNavigate()
 const [username, setUsername] = useState('')
 const [password, setPassword] = useState('')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const onSubmit = async (e: React.FormEvent) => {
   e.preventDefault()
   setLoading(true)
   setError(null)

   try {
     // Try login first
     let loginResult = await window.api.loginUser(username, password)

     // If error, create user and login
     if ('error' in loginResult) {
       const createResult = await window.api.createUser(username, password)

       if ('error' in createResult) {
         setError(createResult.error)
         setLoading(false)
         return
       }

       loginResult = createResult
     }

     // Successfully logged in
     navigate('/dashboard')
   } catch (err) {
     console.error(err)
     setError('Something went wrong.')
   } finally {
     setLoading(false)
   }
 }

    return (
      <div className="grid min-h-screen place-items-center">
        <div
          className="flex flex-col justify-center w-full max-w-80 rounded-xl px-6 py-8 
  border bg-white text-slate-900 text-sm 
  border-slate-200 
  dark:bg-slate-900 dark:text-white dark:border-slate-700"
        >
          {/* Logo area */}
          <div className="flex justify-center mb-6">
            {/* Replace with your Image component or SVG */}
            <img src={Logo} alt="" />
          </div>

          <h2 className="text-2xl font-semibold">Sign In</h2>
          <p className="text-slate-600 dark:text-slate-300 mt-1">Login to your account</p>

          <form className="mt-8" onSubmit={onSubmit}>
            <label
              htmlFor="username"
              className="block mb-1 font-medium text-slate-700 dark:text-slate-300"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@jd10"
              className="w-full p-2 mb-3 bg-white border border-slate-300 text-slate-900
              dark:bg-slate-900 dark:border-slate-700 dark:text-white
              rounded-md focus:outline-none focus:ring-1 transition
              focus:ring-indigo-500 focus:border-indigo-500"
              required
            />

            <label
              htmlFor="password"
              className="block mb-1 font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-2 mb-2 bg-white border border-slate-300 text-slate-900
              dark:bg-slate-900 dark:border-slate-700 dark:text-white
              rounded-md focus:outline-none focus:ring-1 transition
              focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-10 px-4 py-2.5 font-medium text-white 
              bg-primary border rounded-md hover:bg-primary/90 
              focus:outline-none focus:ring-2"
            >
              {loading ? 'Loading...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    )
}

export default Login