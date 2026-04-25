import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

const OAuthSuccess = () => {
  const navigate = useNavigate()

  useEffect(() => {
    fetch("http://localhost:8080/oauth2/success", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem("auth_user", JSON.stringify({
          email: data.email,
          fullName: data.name,
          role: "STUDENT"
        }))

        navigate("/dashboard")
      })
      .catch(() => {
        navigate("/login")
      })
  }, [])

  
  return <h2 style={{textAlign:"center"}}>Logging in...</h2>
}

export default OAuthSuccess