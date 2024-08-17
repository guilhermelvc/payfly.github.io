firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    window.location.replace("../views/Painel.html");
  }
})


function onChangeEmail() {
    toggleButtonsDisable();
    toggleEmailErrors();
}

function onChangePassword() {
    toggleButtonsDisable();
    togglePasswordErrors();
} 

function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    firebase.auth().signInWithEmailAndPassword(email, password).then(response => {
      window.location.replace("../views/Painel.html");
    }).catch(error => {
      alert(getErrorMessage(error)); // passe o error como parâmetro
    })
  }

  function getErrorMessage(error) {
    if (error && error.code) {
      if (error.code === "auth/user-not-found") {
        return "Usuário não encontrado";
      }
      if (error.code === "auth/wrong-password") {
        return "Senha Inválida";
      }
      if (error.code === "auth/invalid-credential") {
        return "E-mail ou senha inválidos";
      }
    }
    return error.message;
  }

  function register() {
    window.location.replace("../views/Cadastro.html");
  }
  
  function recoverPassword() {
    const email = document.getElementById("email").value;
    if (!validateEmail(email)) {
      alert("Endereço de e-mail inválido");
      return;
    }
    firebase.auth().sendPasswordResetEmail(email).then(() => {
      alert("E-mail de recuperação enviado com sucesso!");
    }).catch(error => {
      alert(getErrorMessage(error));
    });
  }

function toggleEmailErrors() {
    const email = document.getElementById("email").value;
    if (!email) {
        document.getElementById("email-required-error").style.display = "block";
    } else {
        document.getElementById("email-required-error").style.display = "none";
    }
    
    if (validateEmail(email)) {
        document.getElementById("email-invalid-error").style.display = "none";
    } else {
        document.getElementById("email-invalid-error").style.display = "block";
    }
}

function togglePasswordErrors() {
    const password = document.getElementById("password").value;
    if (!password) {
       document.getElementById("password-required-error").style.display = "block";
    } else {
       document.getElementById("password-required-error").style.display = "none";
    }
}

function toggleButtonsDisable() {
    const emailValid = isEmailValid();
    document.getElementById("recover-password-button").disabled = !emailValid;

    const passwordValid = isPasswordValid();
    document.getElementById("login-button").disabled = !emailValid || !passwordValid;
}

function isEmailValid() {
    const email = document.getElementById("email").value;
    if (!email) {
        return false;
    }
    return validateEmail(email);
}

function isPasswordValid() {
    const password = document.getElementById("password").value;
    if (!password) {
        return false;
    }
    return true;
}

function validateEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      window.location.replace("../views/Painel.html");
    })
    .catch((error) => {
      console.log(error);
    });
}

firebase.auth().onAuthStateChanged(function(user) {
  // ...
  return false;
});