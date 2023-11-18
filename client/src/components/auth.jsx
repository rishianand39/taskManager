import React, { useEffect, useState } from "react";
import "../styles/scss/auth.scss";
import { Link } from "react-router-dom";
import { handleSignIn, handleSignUp } from "../api/services/userServices";
import { useSelector, useDispatch } from 'react-redux';
import { setLoginError, setLoginLoading, setRedirect, setUser } from "../redux/userSlice";


const Auth = () => {

  const state = useSelector((state) => state.user);

  const dispatch = useDispatch();


  const [signInInfo, setSignInInfo] = useState({
    email : "",
    password : ""
  })
  const [signUpInfo, setSignUpInfo] = useState({
    name : "",
    email : "",
    password : "",
  })

  const btnclick = () => {
    const container = document?.getElementById("container");

    let rightPanelActive = container.classList.contains("right-panel-active");
    if (rightPanelActive) {
      container.classList.remove("right-panel-active");
    } else {
      container.classList.add("right-panel-active");
    }
  };
  const handleSignInLogic = async()=>{
    dispatch(setLoginLoading());
    try {
     let userData = await handleSignIn(signInInfo)
      dispatch(setUser(userData))
      dispatch(setRedirect("loginForm"))
    } catch (error) {
      dispatch(setLoginError(error.message))
    }
  }

  const handleSignUpLogic = async()=>{
    dispatch(setLoginLoading());
    try {
     let userData = await handleSignUp(signUpInfo)
     
    } catch (error) {
      dispatch(setLoginError(error.message))
    }
  }

  useEffect(() => {
    if (state.redirectPath === "loginForm") {
      const container = document?.getElementById("container");
      container.classList.remove("right-panel-active");
      dispatch(setRedirect(null));
    }
  }, [state.redirectPath, dispatch]);

  return (
    <div className="authContainer" id="container">
      <div className="form-container sign-up-container">
        <form>
          <h1>Create Account</h1>
          <input type="text" placeholder="Name" />
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button onClick={handleSignUpLogic}>Sign Up</button>
        </form>
      </div>
      <div className="form-container sign-in-container">
        <form>
          <h1>Sign in</h1>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <Link className="link" to="/resetpassword">
            Forgot your password?
          </Link>
          <button onClick={handleSignInLogic}>Sign In</button>
        </form>
      </div>
      <div className="overlay-container">
        <div className="overlay">
         
          <div className="overlay-panel overlay-right">
            <h1>Hello, Friend!</h1>
            <p>Enter your personal details and start journey with us</p>
            <button className="ghost" id="signUp" onClick={() => btnclick()}>
              Sign Up
            </button>
          </div>
          <div className="overlay-panel overlay-left">
            <h1>Welcome Back!</h1>
            <p>
              To keep connected with us please login with your personal info
            </p>
            <button className="ghost" id="signIn" onClick={() => btnclick()}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
