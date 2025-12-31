import { useState } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

function Auth({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false);
  const [error, setError] = useState("");

 const submit = async () => {
  try {
    signup
      ? await createUserWithEmailAndPassword(auth, email, password)
      : await signInWithEmailAndPassword(auth, email, password);

    // ✅ THIS IS THE LINE YOU ADD
    onSuccess();

  } catch (err) {
    setError(err.message);
  }
};

  return (
    <div className="auth-page">
      <h2>{signup ? "Create account" : "Login"}</h2>

      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={submit}>{signup ? "Sign up" : "Login"}</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p onClick={() => setSignup(!signup)} style={{ cursor: "pointer" }}>
        {signup ? "Have an account? Login" : "No account? Sign up"}
      </p>
    </div>
  );
}

export default Auth;
