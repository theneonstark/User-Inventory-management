// import { useEffect } from 'react';
// import axios from 'axios';
// import { Inertia } from '@inertiajs/inertia';

// const useCheckUserStatus = () => {
//     useEffect(() => {
//         const checkStatus = async () => {
//             try {
//                 // Sending GET request to the backend to check if the user is active
//                 const response = await axios.get('Userlogin');

//                 // If the user is inactive, logout and redirect to the login page
//                 if (response.data.message === 'Your account has been deactivated.') {
//                     Inertia.visit('/login');  // Redirect to logout page
//                 }
//             } catch (error) {
//                 // Handle errors (e.g., user is inactive or other issues)
//                 if (error.response && error.response.status === 403) {
//                     Inertia.visit('/login');  // Redirect to logout page
//                 }
//             }
//         };

//         checkStatus();

//         // Optional: Set an interval to recheck periodically
//         const interval = setInterval(checkStatus, 5000);

//         return () => clearInterval(interval);
//     }, []);
// };

// export default useCheckUserStatus;
