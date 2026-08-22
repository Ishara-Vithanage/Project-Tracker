//*****************************************************************************************
//** Project       : Project Tracking System      
//** Author        : Ishara Harshana
//** Written Date  : 15/05/2025
//** Purpose       : Inert Audit logs
//*****************************************************************************************

import axios from 'axios';
import { env } from 'process';

const backendAPI = env.BASE_API_URL

interface AuditLog {
  user: string;
  action: string;
  keyValue: string;
  tableName: string;
  updateField: string;
  newValue: string;
  oldValue: string;
  LMD: string;
}

const auditLog = async (values: AuditLog): Promise<any> => {
  try {
    console.log("Audit log values:", values);
    const response = await axios.post(`${backendAPI}/Audit`, values);
    if (response.status == 201) {
      console.log("Audit added", response)
    }
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default auditLog;