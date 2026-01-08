import { useNavigate } from 'react-router-dom'
import Logo from '../assets/logo.jpeg'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Eye, EyeOff } from 'lucide-react' // 👈 Import icons
import { toast } from 'react-toastify'

const Login = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [checkingUsers, setCheckingUsers] = useState(true)

  // 🔑 Toggle for password visibility
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await window.api.getUsers()
        const usersFromDb = res.data ?? []
        setUsers(usersFromDb)

        // 👉 No user exists → show create account modal
        if (usersFromDb.length === 0) {
          setShowCreateModal(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setCheckingUsers(false)
      }
    }

    getUsers()
  }, [])

  if (checkingUsers) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p>Checking account…</p>
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await window.api.loginUser(username, password)
      console.log(res);
      if (res.success) {
        toast.success("Login successfull")
        navigate('/dashboard')
        return
      }
      
      toast.error(res.error || "error trying to login")

    } catch (err) {
      console.error(err)
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center">
      {/* Create Admin Dialog */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          if (users.length === 0) return
          setShowCreateModal(open)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Admin Account</DialogTitle>
            <DialogDescription>
              No user found. Create the first account to continue.
            </DialogDescription>
          </DialogHeader>

          <form
            className="mt-4 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setLoading(true)
              setError(null)

              const res = await window.api.createUser(username, password)

              if ('error' in res) {
                setError(res.error)
                setLoading(false)
                return
              }

              setShowCreateModal(false)
              navigate('/dashboard')
            }}
          >
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-md border px-3 py-2"
              required
            />

            {/* Password input with toggle */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} // 👈 toggle type
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-md border px-3 py-2"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-5 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary py-2 text-white"
            >
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Login Form */}
      <div className="flex flex-col justify-center w-full max-w-80 rounded-xl px-6 py-8 border bg-white text-slate-900 text-sm border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700">
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="Logo" />
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
            className="w-full p-2 mb-3 bg-white border border-slate-300 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />

          <label
            htmlFor="password"
            className="block mb-1 font-medium text-slate-700 dark:text-slate-300"
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} // 👈 toggle type
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-2 mb-2 bg-white border border-slate-300 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-5 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-red-500 mb-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-10 px-4 py-2.5 font-medium text-white bg-primary border rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2"
          >
            {loading ? 'Loading...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
