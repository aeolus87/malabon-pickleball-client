// Test script for Web3Forms contact form integration
const testContactForm = async () => {
  const WEB3FORMS_ACCESS_KEY = "5635287e-9e77-4cb9-82e4-39753e357bff";
  
  try {
    console.log("🧪 Testing contact form submission to Web3Forms...\n");
    
    const testData = {
      access_key: WEB3FORMS_ACCESS_KEY,
      name: "Test User",
      email: "test2@example.com",
      subject: "Test Contact Form - Debug",
      message: "This is a test message to verify the contact form functionality with Web3Forms. Please ignore.",
      from_name: "Malabon Pickleballers Contact Form",
      botcheck: "",
    };

    console.log("📤 Sending test data:", JSON.stringify(testData, null, 2), "\n");

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "MalabonPickleballers/1.0"
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    
    console.log("📥 Response Status:", response.status);
    console.log("📥 Response Headers:", Object.fromEntries(response.headers.entries()));
    console.log("📥 Response Body:", JSON.stringify(data, null, 2), "\n");
    
    if (data.success) {
      console.log("✅ Contact form test successful!");
      console.log("Please check your email (including spam folder) for the test message.");
      console.log("Note: It may take 1-2 minutes for the email to arrive.");
    } else {
      console.log("❌ Contact form test failed!");
      console.log("Error:", data.message);
    }
  } catch (error) {
    console.error("❌ Error testing contact form:", error);
  }
};

// Run the test
testContactForm(); 