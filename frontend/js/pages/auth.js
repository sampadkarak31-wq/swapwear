function renderLogin(app) {
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <h1>Welcome back</h1>
        <p class="sub">Log in to continue swapping.</p>
        <form id="login-form">
          <div class="field">
            <label for="email">Email</label>
            <input type="email" id="email" required autocomplete="email"/>
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" required autocomplete="current-password"/>
          </div>
          <div id="login-error" class="field-error"></div>
          <button type="submit" class="btn btn-primary btn-block">Log in</button>
        </form>
        <p class="auth-switch"><a href="#/forgot-password" data-link>Forgot your password?</a></p>
        <p class="auth-switch">New to SwapWear? <a href="#/register" data-link>Create an account</a></p>
      </div>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';
    btn.disabled = true;
    try {
      const { token, user } = await api.login({
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      });
      setSession(token, user);
      toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

function renderRegister(app) {
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <h1>Create your account</h1>
        <p class="sub">Join SwapWear and start trading today.</p>
        <form id="register-form">
          <div class="field">
            <label for="name">Full name</label>
            <input type="text" id="name" required/>
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input type="email" id="email" required autocomplete="email"/>
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" required minlength="8" autocomplete="new-password"/>
            <div class="field-hint">At least 8 characters.</div>
          </div>
          <div id="register-error" class="field-error"></div>
          <button type="submit" class="btn btn-primary btn-block">Create account</button>
        </form>
        <p class="auth-switch">Already have an account? <a href="#/login" data-link>Log in</a></p>
      </div>
    </div>`;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const errEl = document.getElementById('register-error');
    errEl.textContent = '';
    btn.disabled = true;
    try {
      const { token, user } = await api.register({
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      });
      setSession(token, user);
      toast(`Welcome to SwapWear, ${user.name.split(' ')[0]}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

function renderForgotPassword(app) {
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <h1>Reset your password</h1>
        <p class="sub">Enter your email and we'll send a reset link.</p>
        <form id="forgot-form">
          <div class="field">
            <label for="email">Email</label>
            <input type="email" id="email" required/>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Send reset link</button>
        </form>
        <p class="auth-switch"><a href="#/login" data-link>Back to log in</a></p>
      </div>
    </div>`;

  document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    try {
      await api.forgotPassword(document.getElementById('email').value.trim());
      toast('If that email is registered, a reset link has been sent', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
