import axios from 'axios';
import { showAlert } from './alerts';
// Type is eithern 'Password' or 'Data'
export const updateSettings = async (data, type) => {
    try {

        const url = type === 'password'
            ? '/api/v1/users/updateMyPassword'
            : '/api/v1/users/updateMe'; 
        const res = await axios({
            method: 'PATCH',
            url,
            data
        });
        console.log(res.data);
        if (res.data.status === 'Successfully created') {
            showAlert('success', `${type.toUpperCase()} updated successfully!`);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};
