//*****************************************************************************************
//** Project       : Project Tracking System       
//** Author        : Ishara Harshana
//** Written Date  : 28/11/2024
//** Purpose       : Service to send Emails using the Email API
//*****************************************************************************************
import axios from 'axios';
import { env } from process;

// Define the base URL for Email API
const API_URL = `${env.BASE_API_URL}/Mail/send-email`;

// Service for sending an email
const sendEmail = async (emailData) => {
    try {
        const response = await axios.post(`${API_URL}`, emailData);
        return response.data;  // Return the created email data
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export default sendEmail;