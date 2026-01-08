// lib/utils/debug.ts
export const debugEmployeeData = async () => {
  try {
    console.log('🔍 Starting employee data debug...');
    
    // Check what the /employees/me/ endpoint returns
    const response = await fetch('http://192.168.100.25:8000/api/employees/me/', {
      headers: {
        'Authorization': `Bearer ${await SecureStore.getItemAsync('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log('📋 Employee API Response:', {
      status: response.status,
      data: data,
      keys: Object.keys(data),
      hasEmployeeData: !!data,
      hasOrganization: !!data.organization,
      hasOrganizationData: !!data.organization_data,
    });
    
    return data;
  } catch (error) {
    console.error('❌ Debug error:', error);
    return null;
  }
};