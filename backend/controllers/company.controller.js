import { Company } from "../models/company.model.js";
import { uploadBuffer } from "../utils/uploadFile.js";

const assertCompanyOwner = (company, userId, res) => {
  if (!company) {
    res.status(404).json({
      message: "Company not found",
      success: false,
    });
    return false;
  }

  if (String(company.userId) !== String(userId)) {
    res.status(403).json({
      message: "You are not allowed to manage this company",
      success: false,
    });
    return false;
  }

  return true;
};

export const registerCompany = async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({
        message: "Company name is required",
        success: false,
      });
    }
    let company = await Company.findOne({ name: companyName });
    if (company) {
      return res.status(400).json({
        message: "You can't register same company ",
        success: false,
      });
    }
    company = await Company.create({
      name: companyName,
      userId: req.id,
    });

    return res.status(201).json({
      message: "Company registered Successfully",
      company,
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to register company",
      success: false,
    });
  }
};

export const getCompany = async (req, res) => {
  try {
    const userId = req.id;
    const companies = await Company.find({ userId });

    return res.status(200).json({
      companies: companies || [],
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to fetch companies",
      success: false,
    });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId);
    if (!assertCompanyOwner(company, req.id, res)) {
      return;
    }

    return res.status(200).json({
      company,
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to fetch company",
      success: false,
    });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { name, description, website, location } = req.body;
    const file = req.file;

    const existingCompany = await Company.findById(req.params.id);
    if (!assertCompanyOwner(existingCompany, req.id, res)) {
      return;
    }

    const updateData = {
      name,
      description,
      website,
      location,
    };

    if (file) {
      const logoUrl = await uploadBuffer(file, "jobvista/company-logos");
      if (logoUrl) {
        updateData.logo = logoUrl;
      }
    }

    const company = await Company.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    return res.status(200).json({
      message: "Company information updated successfully",
      company,
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
      success: false,
    });
  }
};
