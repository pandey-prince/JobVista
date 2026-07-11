/**
 * Verified career board configs keyed by companyName.
 * Used when auto-probe would be slow or unreliable.
 */
export const KNOWN_CAREER_BOARDS = {
  "HCL Technologies": {
    url: "https://careers.hcltech.com/services/rss/job/?locale=en_US",
    scraperType: "successfactors-rss",
    isActive: true,
  },
  SAP: {
    url: "https://jobs.sap.com/services/rss/job/?locale=en_US",
    scraperType: "successfactors-rss",
    isActive: true,
  },
  Intel: {
    url: "https://intel.wd1.myworkdayjobs.com/en-US/External",
    scraperType: "workday",
    isActive: true,
  },
  NVIDIA: {
    url: "https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite",
    scraperType: "workday",
    isActive: true,
  },
  Salesforce: {
    url: "https://salesforce.wd12.myworkdayjobs.com/en-US/External_Career_Site",
    scraperType: "workday",
    isActive: true,
  },
  Adobe: {
    url: "https://adobe.wd5.myworkdayjobs.com/en-US/external_experienced",
    scraperType: "workday",
    isActive: true,
  },
  Cisco: {
    url: "https://cisco.wd5.myworkdayjobs.com/en-US/Cisco_Careers",
    scraperType: "workday",
    isActive: true,
  },
  HP: {
    url: "https://hp.wd5.myworkdayjobs.com/en-US/ExternalCareerSite",
    scraperType: "workday",
    isActive: true,
  },
  Workday: {
    url: "https://workday.wd5.myworkdayjobs.com/en-US/Workday",
    scraperType: "workday",
    isActive: true,
  },
  Zendesk: {
    url: "https://zendesk.wd1.myworkdayjobs.com/en-US/Zendesk",
    scraperType: "workday",
    isActive: true,
  },
  Swiggy: {
    url: "https://jobs.smartrecruiters.com/Swiggy",
    scraperType: "smartrecruiters",
    isActive: true,
    selectors: { slug: "Swiggy" },
  },
  Freshworks: {
    url: "https://jobs.smartrecruiters.com/Freshworks",
    scraperType: "smartrecruiters",
    isActive: true,
    selectors: { slug: "Freshworks" },
  },
  Unacademy: {
    url: "https://jobs.smartrecruiters.com/Unacademy",
    scraperType: "smartrecruiters",
    isActive: true,
    selectors: { slug: "Unacademy" },
  },
  Uber: {
    url: "https://jobs.smartrecruiters.com/Uber",
    scraperType: "smartrecruiters",
    isActive: true,
    selectors: { slug: "Uber" },
  },
  ServiceNow: {
    url: "https://jobs.smartrecruiters.com/ServiceNow",
    scraperType: "smartrecruiters",
    isActive: true,
    selectors: { slug: "ServiceNow" },
  },
  Canva: {
    url: "https://jobs.smartrecruiters.com/Canva",
    scraperType: "smartrecruiters",
    isActive: true,
    selectors: { slug: "Canva" },
  },
  Zomato: {
    url: "https://jobs.lever.co/eternal",
    scraperType: "lever",
    isActive: true,
  },
  Dream11: {
    url: "https://jobs.lever.co/dreamsports",
    scraperType: "lever",
    isActive: true,
  },
  Atlassian: {
    url: "https://jobs.lever.co/atlassian",
    scraperType: "lever",
    isActive: true,
  },
  Netflix: {
    url: "https://jobs.lever.co/netflix",
    scraperType: "lever",
    isActive: true,
  },
  AMD: {
    url: "https://careers.amd.com/careers-home/jobs",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  GitHub: {
    url: "https://www.github.careers/careers-home/jobs",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Dell Technologies": {
    url: "https://iawmqy.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/careers/jobs",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Oracle: {
    url: "https://careers.oracle.com/en/sites/jobsearch/jobs",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Google: {
    url: "https://www.google.com/about/careers/applications/jobs/results",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Microsoft: {
    url: "https://apply.careers.microsoft.com/careers",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Amazon: {
    url: "https://www.amazon.jobs/en/search?loc_query=India&country=IND",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Apple: {
    url: "https://jobs.apple.com/en-us/search",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Meta: {
    url: "https://www.metacareers.com/jobs",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  IBM: {
    url: "https://www.ibm.com/careers/search?field_keyword_05[0]=India",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Goldman Sachs": {
    url: "https://higher.gs.com/results",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Morgan Stanley": {
    url: "https://morganstanley.tal.net/vx/lang-en-GB/mobile-0/channel-1/candidate/jobboard/v2/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Splunk: {
    url: "https://careers.cisco.com/global/en/search-results",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Palo Alto Networks": {
    url: "https://jobs.paloaltonetworks.com/en/jobs/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  CrowdStrike: {
    url: "https://www.crowdstrike.com/en-us/careers/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Shopify: {
    url: "https://www.shopify.com/careers/search?locations%5B%5D=India",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  HashiCorp: {
    url: "https://www.ibm.com/careers/search?keyword=HashiCorp&field_keyword_05[0]=India",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Flipkart: {
    url: "https://www.flipkartcareers.com/#!/job-listing",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Razorpay: {
    url: "https://razorpay.com/careers/jobs/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  BrowserStack: {
    url: "https://www.browserstack.com/careers/openings",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Chargebee: {
    url: "https://jobs.chargebee.com/jobs",
    scraperType: "auto-puppeteer",
    isActive: false,
  },
  Delhivery: {
    url: "https://www.delhivery.com/careers",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Lenskart: {
    url: "https://careers.lenskart.com",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  ShareChat: {
    url: "https://sharechat.com/careers",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Urban Company": {
    url: "https://careers.urbancompany.com/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Zoho: {
    url: "https://www.zoho.com/careers/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Zerodha: {
    url: "https://careers.zerodha.com/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Ola: {
    url: "https://www.olacabs.com/careers",
    scraperType: "auto-puppeteer",
    isActive: false,
  },
  Policybazaar: {
    url: "https://www.policybazaar.com/careers/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Nykaa: {
    url: "https://careers.nykaa.com/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Oyo: {
    url: "https://www.oyorooms.com/careers",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  PayPal: {
    url: "https://careers.pypl.com/search-jobs",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Intuit: {
    url: "https://jobs.intuit.com/search-jobs",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  VMware: {
    url: "https://broadcom.wd1.myworkdayjobs.com/en-US/External_Career",
    scraperType: "workday",
    isActive: true,
  },
  "Tech Mahindra": {
    url: "https://careers.techmahindra.com/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  LTIMindtree: {
    url: "https://www.ltm.com/careers",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Mphasis: {
    url: "https://careers.mphasis.com/home/hot-jobs/location-search/india.html",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Persistent Systems": {
    url: "https://www.persistent.com/careers/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Coforge: {
    url: "https://careers.coforge.com/coforge/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Hexaware: {
    url: "https://jobs.hexaware.com/#en/sites/CX_1/jobs",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Cyient: {
    url: "https://www.cyient.careers/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Zensar: {
    url: "https://www.zensar.com/careers",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  Birlasoft: {
    url: "https://www.birlasoft.com/careers",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Sonata Software": {
    url: "https://www.sonata-software.com/careers",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Happiest Minds": {
    url: "https://www.happiestminds.com/careers/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "ICICI Bank": {
    url: "https://www.icicicareers.com/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "HDFC Bank": {
    url: "https://www.hdfc.bank.in/careers",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Axis Bank": {
    url: "https://www.axis.bank.in/careers",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Kotak Mahindra Bank": {
    url: "https://www.kotak.bank.in/en/about-us/careers.html",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Jio Platforms": {
    url: "https://careers.jio.com/",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Tata Digital": {
    url: "https://www.tataneu.com/careers",
    scraperType: "auto-puppeteer",
    isActive: false,
  },
  "Reliance Retail": {
    url: "https://www.ril.com/Careers/Retail",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Mahindra & Mahindra": {
    url: "https://www.mahindra.com/career",
    scraperType: "auto-puppeteer",
    isActive: true,
  },
  "Bajaj Finserv": {
    url: "https://www.bajajfinserv.in/careers",
    scraperType: "auto-puppeteer",
    isActive: false,
  },
  Udaan: {
    url: "https://careers.udaan.com/",
    scraperType: "auto-puppeteer",
    isActive: false,
  },
};
