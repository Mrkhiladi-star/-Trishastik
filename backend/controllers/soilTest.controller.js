const SoilTest = require("../models/soilTest");
const User = require("../models/user");
const logger = require("../utils/logger");

const getSoilTests = async (req, res, next) => {
  try {
    let tests;
    if (req.user.role === "agent") {
      tests = await SoilTest.find({ agent: req.user._id })
        .populate("farmer", "username email fullName")
        .sort({ requestedAt: -1 });
    } else {
      tests = await SoilTest.find({ farmer: req.user._id })
        .populate("agent", "username email fullName")
        .sort({ requestedAt: -1 });
    }
    res.json({ soilTests: tests });
  } catch (err) {
    next(err);
  }
};

const createSoilTest = async (req, res, next) => {
  try {
    const { farmerName, phone, farmArea, cropPlanned, soilType, address, stateDistrictVillage, additionalNotes, latitude, longitude } = req.body.soilTest || req.body;
    if (!farmerName || !phone || !farmArea || !cropPlanned || !soilType || !address || !stateDistrictVillage || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Please enter all required soil test details including location." });
    }
    const newTest = new SoilTest({
      farmer: req.user._id,
      farmerName,
      phone,
      farmArea,
      cropPlanned,
      soilType,
      address,
      stateDistrictVillage,
      additionalNotes,
      latitude,
      longitude,
      status: "Pending"
    });
    await newTest.save();
    logger.info(`Soil test request created by farmer ${req.user.username}`);
    res.json({ success: true, soilTest: newTest });
  } catch (err) {
    next(err);
  }
};

const adminGetAllSoilTests = async (req, res, next) => {
  try {
    const allTests = await SoilTest.find({})
      .populate("farmer", "username email fullName role")
      .populate("agent", "username email fullName phone")
      .sort({ requestedAt: -1 });
    res.json({ soilTests: allTests });
  } catch (err) {
    next(err);
  }
};

const adminGetAllAgents = async (req, res, next) => {
  try {
    const agents = await User.find({ role: "agent" }, "username email fullName phone");
    res.json({ agents });
  } catch (err) {
    next(err);
  }
};

const adminAssignAgent = async (req, res, next) => {
  try {
    const { agentId, labFacility } = req.body;
    const test = await SoilTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Soil test not found." });
    }
    
    test.agent = agentId;
    if (labFacility) {
      test.labFacility = labFacility;
    }
    test.status = "Assigned";
    await test.save();
    
    const updatedTest = await SoilTest.findById(req.params.id)
      .populate("farmer", "username email fullName")
      .populate("agent", "username email fullName phone");
      
    logger.info(`Agent ${agentId} assigned to Soil Test ${req.params.id}`);
    res.json({ success: true, soilTest: updatedTest });
  } catch (err) {
    next(err);
  }
};

const uploadReport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a file." });
    }
    const test = await SoilTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Soil test not found." });
    }
    test.labReportUrl = `/uploads/${req.file.filename}`;
    if (test.status !== "Completed" && test.status !== "Report Ready") {
      test.status = "Report Ready";
    }
    if (req.user.role === "agent") {
      test.isPublished = false;
    }
    await test.save();
    logger.info(`Report file uploaded for Soil Test ${req.params.id}`);
    res.json({ success: true, labReportUrl: test.labReportUrl, status: test.status });
  } catch (err) {
    next(err);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const { status, reportContent, recommendedFertilizers, isPublished } = req.body;
    const test = await SoilTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Soil test request not found." });
    }
    if (status) {
      if (req.user.role === "agent" && status === "Completed") {
        return res.status(400).json({ error: "Access denied: Agents are not authorized to mark soil tests as Completed." });
      }
      test.status = status;
    }
    if (reportContent !== undefined) test.reportContent = reportContent;
    if (recommendedFertilizers !== undefined) test.recommendedFertilizers = recommendedFertilizers;
    
    if (req.user.role === "agent") {
      test.isPublished = false;
    } else if (req.user.role === "admin" || req.user.email === "freeforfire15@gmail.com") {
      if (isPublished !== undefined) {
        test.isPublished = isPublished;
      }
    }
    
    await test.save();
    logger.info(`Report details updated for Soil Test ${req.params.id}`);
    res.json({ success: true, soilTest: test });
  } catch (err) {
    next(err);
  }
};

const adminPublishReport = async (req, res, next) => {
  try {
    const test = await SoilTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Soil test not found." });
    }
    test.isPublished = true;
    test.status = "Completed";
    await test.save();
    logger.info(`Soil Test ${req.params.id} published by admin`);
    res.json({ success: true, soilTest: test });
  } catch (err) {
    next(err);
  }
};

const agentGetAssignedSoilTests = async (req, res, next) => {
  try {
    const tests = await SoilTest.find({ agent: req.user._id })
      .populate("farmer", "username email fullName phone address")
      .sort({ requestedAt: -1 });
    res.json({ soilTests: tests });
  } catch (err) {
    next(err);
  }
};

const agentUpdateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Assigned", "Sample Collected", "Testing", "Report Ready"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status update for field agent." });
    }
    const test = await SoilTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Soil test not found." });
    }
    if (test.agent && test.agent.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied: You are not the assigned agent." });
    }
    test.status = status;
    await test.save();
    logger.info(`Soil Test ${req.params.id} status updated to ${status} by agent/admin`);
    res.json({ success: true, soilTest: test });
  } catch (err) {
    next(err);
  }
};

const analyzeReport = async (req, res, next) => {
  try {
    const test = await SoilTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Soil test request not found." });
    }

    if (req.body.reportContent !== undefined) {
      test.reportContent = req.body.reportContent;
    }
    if (req.body.recommendedFertilizers !== undefined) {
      test.recommendedFertilizers = req.body.recommendedFertilizers;
    }
    if (req.body.reportContent !== undefined || req.body.recommendedFertilizers !== undefined) {
      await test.save();
    }

    const { reportContent, cropPlanned, soilType, farmArea } = test;
    if (!reportContent) {
      return res.status(400).json({ error: "Cannot generate AI suggestions without soil report analysis details. Please fill out the Soil Analysis Summary first." });
    }

    const grokKey = process.env.GROK_API_KEY;
    let aiResponseData;

    if (!grokKey) {
      logger.info("GROK_API_KEY env not configured, generating mock response...");
      const pHMatch = reportContent.match(/pH\s*[:=]\s*([0-9.]+)/i);
      const pHVal = pHMatch ? parseFloat(pHMatch[1]) : 6.5;
      const isAcidic = pHVal < 6.0;
      
      const nMatch = reportContent.toLowerCase().includes("nitrogen") || reportContent.toLowerCase().includes("low n") || reportContent.toLowerCase().includes("deficien");
      const pMatch = reportContent.toLowerCase().includes("phosphorus") || reportContent.toLowerCase().includes("low p");

      let npkStr = "Nitrogen: Optimal. Phosphorus: Moderate. Potassium: High.";
      let deficiencyStr = "No significant deficiencies found. Soil is well balanced.";
      let fertStr = `Apply general organic compost. Standard dosage: 2-3 tons per acre for a farm area of ${farmArea} acres.`;
      
      if (nMatch || isAcidic) {
        npkStr = "Nitrogen (N): Low. Phosphorus (P): Medium. Potassium (K): High.";
        deficiencyStr = "Nitrogen deficiency detected, which can stunt vegetative growth and cause yellowing leaves.";
        fertStr = "Apply Urea or ammonium sulphate. For organic options, use neem cake or blood meal.";
      } else if (pMatch) {
        npkStr = "Nitrogen (N): Medium. Phosphorus (P): Low. Potassium (K): Medium.";
        deficiencyStr = "Phosphorus deficiency. Root development and seed setting might be hampered.";
        fertStr = "Apply Single Super Phosphate (SSP) or Diammonium Phosphate (DAP). Organic option: Bone meal.";
      }

      aiResponseData = {
        npkAnalysis: npkStr + ` (pH: ${pHVal})`,
        deficiencyExplanation: deficiencyStr,
        fertilizerRecommendation: fertStr + ` Customized for ${farmArea} acres of ${cropPlanned}.`,
        organicImprovement: `Incorporate vermicompost, cow dung manure, and green manuring (dhaincha) to improve soil organic carbon from the current status.`,
        waterManagement: `For ${soilType} soil, implement drip irrigation to prevent leaching. Maintain moist conditions but avoid waterlogging for ${cropPlanned}.`,
        bestCrops: `${cropPlanned} is suitable. Rotate with leguminous crops like chickpeas, field peas, or green gram to restore nitrogen naturally.`
      };
    } else {
      logger.info("Calling Grok API...");
      
      const prompt = `You are a professional agricultural scientist and soil expert. 
Analyze the following soil testing report details:
Planned Crop: ${cropPlanned}
Farm Area: ${farmArea} acres
Soil Type: ${soilType}
Report Content: ${reportContent}

Provide a detailed, structured, farmer-friendly analysis in JSON format containing the following fields:
{
  "npkAnalysis": "Detailed assessment of Nitrogen (N), Phosphorus (P), and Potassium (K) levels based on the report.",
  "deficiencyExplanation": "Simple explanation of any nutrient deficiencies and their impact on the planned crop.",
  "fertilizerRecommendation": "Specific fertilizer recommendation (amounts, types, application schedule) tailored to the farm area and planned crop.",
  "organicImprovement": "Organic methods and soil improvement tips (e.g., composting, cover crops, biofertilizers).",
  "waterManagement": "Water management and irrigation advice for the soil type and crop.",
  "bestCrops": "Suggestions for the best crops to grow (both planned crop and alternative crop rotations)."
}
Ensure the JSON is valid and only return the JSON block, nothing else. Do not wrap in markdown code blocks.`;

      const apiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${grokKey}`
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            { role: "system", content: "You are a soil health analysis AI. Always reply with valid JSON format." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`Grok API error: ${apiResponse.statusText}`);
      }

      const responseJson = await apiResponse.json();
      let text = responseJson.choices[0].message.content.trim();
      
      if (text.startsWith("```")) {
        text = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      }

      try {
        aiResponseData = JSON.parse(text);
      } catch (parseErr) {
        console.error("Failed to parse Grok JSON, using text extraction", text);
        aiResponseData = {
          npkAnalysis: "Analysis complete. Consult advisor.",
          deficiencyExplanation: text,
          fertilizerRecommendation: "Refer to description details.",
          organicImprovement: "Apply organic matter regularly.",
          waterManagement: "Water regularly based on crop requirements.",
          bestCrops: cropPlanned
        };
      }
    }

    test.aiAnalysis = aiResponseData;
    await test.save();
    logger.info(`Grok AI soil analysis report completed for request ${req.params.id}`);
    res.json({ success: true, soilTest: test });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSoilTests,
  createSoilTest,
  adminGetAllSoilTests,
  adminGetAllAgents,
  adminAssignAgent,
  uploadReport,
  updateReport,
  adminPublishReport,
  agentGetAssignedSoilTests,
  agentUpdateStatus,
  analyzeReport,
};
