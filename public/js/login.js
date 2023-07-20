import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email: email,
                password: password,
                withCredentials: true
            }
        });
    
        if (res.data.status === 'Successfully created') {
            showAlert('success', 'Logged in successfully');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }

        console.log(res);
    } catch (err) {
        showAlert('error', err.response.data.message);
    } 
};


export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout',
        });
        if (res.data.status = 'success') location.reload(true);
    } catch (err) {
        console.log(err.response.data.message);
        showAlert('error', 'Error logging out, try again');
    }
};

export const signup = async (name, email, password, passwordConfirm) => {
    try {
      const res = await axios({
        method: 'POST',
        url: '/api/v1/users/signup',
        data: {
          name,
          email,
          password,
          passwordConfirm,
        },
      });
  
      if (res.data.status === 'Successfully created') {
        showAlert('success', 'Signed up successfully');
        window.setImmediate(() => {
          location.assign('/');
        }, 1500);
      }
    } catch (err) {
      showAlert('error', err.response.data.message);
    }
  };