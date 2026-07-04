const http = require("http");

const BASE_URL = "http://localhost:3000";

// Helper to keep track of cookies for sessions
class Session {
  constructor(name) {
    this.name = name;
    this.cookies = [];
  }

  updateCookies(headers) {
    const setCookie = headers["set-cookie"];
    if (setCookie) {
      setCookie.forEach(cookieStr => {
        const parts = cookieStr.split(";");
        const cookie = parts[0];
        // Replace or add cookie
        const cookieName = cookie.split("=")[0];
        this.cookies = this.cookies.filter(c => !c.startsWith(cookieName + "="));
        this.cookies.push(cookie);
      });
    }
  }

  getCookieHeader() {
    return this.cookies.join("; ");
  }

  request(options, postData) {
    return new Promise((resolve, reject) => {
      const url = new URL(options.url || BASE_URL);
      const reqOptions = {
        hostname: url.hostname,
        port: url.port || 80,
        path: options.path,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers
        }
      };

      if (this.cookies.length > 0) {
        reqOptions.headers["Cookie"] = this.getCookieHeader();
      }

      const req = http.request(reqOptions, (res) => {
        this.updateCookies(res.headers);
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsedData = data;
          if (res.headers["content-type"] && res.headers["content-type"].includes("application/json")) {
            try {
              parsedData = JSON.parse(data);
            } catch (e) {
              // Not JSON
            }
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        });
      });

      req.on("error", (err) => {
        reject(err);
      });

      if (postData) {
        req.write(JSON.stringify(postData));
      }
      req.end();
    });
  }
}

async function runTest() {
  console.log("=== STARTING AGRI-TECH SOIL TESTING WORKFLOW TEST ===");

  const farmerSession = new Session("Farmer");
  const agentSession = new Session("Agent");
  const adminSession = new Session("Admin");

  const timestamp = Date.now();
  const farmerUsername = `farmer_${timestamp}`;
  const farmerEmail = `farmer_${timestamp}@test.com`;
  const agentUsername = `agent_${timestamp}`;
  const agentEmail = `agent_${timestamp}@test.com`;
  const adminUsername = `admin_${timestamp}`;
  const adminEmail = `sramu1090@gmail.com`; // Matches admin allowed email constraint

  // 1. Register Farmer
  console.log("\n[1] Registering Farmer...");
  const regFarmerRes = await farmerSession.request({
    path: "/register",
    method: "POST"
  }, {
    username: farmerUsername,
    email: farmerEmail,
    password: "password123",
    role: "farmer"
  });
  console.log("Response Status:", regFarmerRes.statusCode);
  console.log("Response Data:", regFarmerRes.data);
  if (regFarmerRes.statusCode !== 200 || !regFarmerRes.data.success) {
    throw new Error("Failed to register Farmer");
  }

  // 2. Register Agent
  console.log("\n[2] Registering Field Agent...");
  const regAgentRes = await agentSession.request({
    path: "/register",
    method: "POST"
  }, {
    username: agentUsername,
    email: agentEmail,
    password: "password123",
    role: "agent"
  });
  console.log("Response Status:", regAgentRes.statusCode);
  console.log("Response Data:", regAgentRes.data);
  if (regAgentRes.statusCode !== 200 || !regAgentRes.data.success) {
    throw new Error("Failed to register Agent");
  }

  // 3. Register Admin
  console.log("\n[3] Registering Admin (email: sramu1090@gmail.com)...");
  const regAdminRes = await adminSession.request({
    path: "/register",
    method: "POST"
  }, {
    username: adminUsername,
    email: adminEmail,
    password: "password123",
    role: "admin"
  });
  console.log("Response Status:", regAdminRes.statusCode);
  console.log("Response Data:", regAdminRes.data);
  if (regAdminRes.statusCode !== 200 || !regAdminRes.data.success) {
    throw new Error("Failed to register Admin");
  }

  // 4. Submit Soil Test Request as Farmer
  console.log("\n[4] Requesting Soil Test as Farmer...");
  const testRequestPayload = {
    soilTest: {
      farmerName: "Ramesh Kumar",
      phone: "9876543210",
      farmArea: 5.5,
      cropPlanned: "Wheat",
      soilType: "Clay Loam",
      address: "Field No. 42, Near Canal Road",
      stateDistrictVillage: "Punjab, Ludhiana, Khanna",
      additionalNotes: "Requesting urgent analysis before monsoon sowing season.",
      latitude: 30.7333,
      longitude: 76.7794
    }
  };
  const requestSoilRes = await farmerSession.request({
    path: "/soil-tests",
    method: "POST"
  }, testRequestPayload);
  console.log("Response Status:", requestSoilRes.statusCode);
  console.log("Response Data:", requestSoilRes.data);
  if (requestSoilRes.statusCode !== 200 || !requestSoilRes.data.success) {
    throw new Error("Failed to submit soil test request");
  }
  const testId = requestSoilRes.data.soilTest._id;
  console.log(`Soil Test Created with ID: ${testId}`);

  // 5. Admin retrieves all soil tests and agents, and assigns the agent
  console.log("\n[5] Fetching Agents as Admin...");
  const agentsRes = await adminSession.request({ path: "/admin/agents" });
  console.log("Response Status:", agentsRes.statusCode);
  const fetchedAgents = agentsRes.data.agents;
  console.log("Agents list count:", fetchedAgents.length);
  const createdAgent = fetchedAgents.find(a => a.email === agentEmail);
  if (!createdAgent) {
    throw new Error("Created agent not found in admin agent list");
  }
  const agentId = createdAgent._id;
  console.log(`Assigning Agent (ID: ${agentId}) to Soil Test (ID: ${testId})...`);

  const assignRes = await adminSession.request({
    path: `/admin/soil-tests/${testId}/assign`,
    method: "POST"
  }, { agentId });
  console.log("Response Status:", assignRes.statusCode);
  console.log("Assigned Soil Test Status:", assignRes.data.soilTest.status);
  if (assignRes.statusCode !== 200 || assignRes.data.soilTest.status !== "Assigned") {
    throw new Error("Failed to assign agent");
  }

  // 6. Agent retrieves assigned tests and updates status to "Sample Collected"
  console.log("\n[6] Fetching assigned tests as Agent...");
  const agentTestsRes = await agentSession.request({ path: "/agent/soil-tests" });
  console.log("Response Status:", agentTestsRes.statusCode);
  console.log("Agent's assigned tests count:", agentTestsRes.data.soilTests.length);
  const myAssignedTest = agentTestsRes.data.soilTests.find(t => t._id === testId);
  if (!myAssignedTest) {
    throw new Error("Agent failed to find assigned test");
  }

  console.log("Updating status to 'Sample Collected' as Agent...");
  const statusUpdateRes = await agentSession.request({
    path: `/agent/soil-tests/${testId}/status`,
    method: "POST"
  }, { status: "Sample Collected" });
  console.log("Response Status:", statusUpdateRes.statusCode);
  console.log("Updated Soil Test Status:", statusUpdateRes.data.soilTest.status);
  if (statusUpdateRes.statusCode !== 200 || statusUpdateRes.data.soilTest.status !== "Sample Collected") {
    throw new Error("Failed to update status to Sample Collected");
  }

  // 7. Admin adds report details and sets status to "Report Ready"
  console.log("\n[7] Updating Report Details as Admin...");
  const reportPayload = {
    status: "Report Ready",
    reportContent: "pH = 5.8 (Acidic). Nitrogen (N) = Low. Phosphorus (P) = Medium. Potassium (K) = High.",
    recommendedFertilizers: "Urea, SSP, Organic manure"
  };
  const reportUpdateRes = await adminSession.request({
    path: `/admin/soil-tests/${testId}/report`,
    method: "POST"
  }, reportPayload);
  console.log("Response Status:", reportUpdateRes.statusCode);
  console.log("Report Content updated:", reportUpdateRes.data.soilTest.reportContent);
  if (reportUpdateRes.statusCode !== 200 || reportUpdateRes.data.soilTest.status !== "Report Ready") {
    throw new Error("Failed to update report details");
  }

  // 8. Admin triggers Grok AI analysis
  console.log("\n[8] Triggering Grok AI Analysis...");
  const analyzeRes = await adminSession.request({
    path: `/soil-tests/${testId}/analyze`,
    method: "POST"
  });
  console.log("Response Status:", analyzeRes.statusCode);
  console.log("AI Analysis Results:");
  console.log(JSON.stringify(analyzeRes.data.soilTest.aiAnalysis, null, 2));
  if (analyzeRes.statusCode !== 200 || !analyzeRes.data.soilTest.aiAnalysis) {
    throw new Error("AI analysis failed or returned empty recommendations");
  }

  // 8.5. Admin approves and publishes report
  console.log("\n[8.5] Admin approves and publishes report...");
  const publishRes = await adminSession.request({
    path: `/admin/soil-tests/${testId}/publish`,
    method: "POST"
  });
  console.log("Response Status:", publishRes.statusCode);
  if (publishRes.statusCode !== 200 || !publishRes.data.soilTest.isPublished || publishRes.data.soilTest.status !== "Completed") {
    throw new Error("Admin failed to publish report");
  }

  // 9. Farmer retrieves history and views completed report details
  console.log("\n[9] Checking Soil Test History as Farmer...");
  const farmerTestsRes = await farmerSession.request({ path: "/soil-tests" });
  console.log("Response Status:", farmerTestsRes.statusCode);
  const myCompletedTest = farmerTestsRes.data.soilTests.find(t => t._id === testId);
  if (!myCompletedTest) {
    throw new Error("Farmer could not find completed test in history");
  }
  console.log("Final status in history:", myCompletedTest.status);
  console.log("Success! Integration test completed successfully.");
}

runTest().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
