// Initialize admin account in localStorage if not exists
export const initializeAdmin = () => {
  const users = JSON.parse(localStorage.getItem("agripulse_users") || "[]");
  
  const adminExists = users.find((u: any) => u.email === "admin@agripulse.com");
  
  if (!adminExists) {
    const adminUser = {
      id: "admin-001",
      email: "admin@agripulse.com",
      name: "Administrator",
      role: "admin",
      password: "admin123",
    };
    
    users.push(adminUser);
    localStorage.setItem("agripulse_users", JSON.stringify(users));
    console.log("✅ Admin account initialized");
  }
};
