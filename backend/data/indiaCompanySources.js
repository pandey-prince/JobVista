const greenhouse = (slug) => ({
  url: `https://boards.greenhouse.io/${slug}`,
  scraperType: "greenhouse",
  isActive: true,
});

const lever = (slug) => ({
  url: `https://jobs.lever.co/${slug}`,
  scraperType: "lever",
  isActive: true,
});

const ashby = (slug) => ({
  url: `https://jobs.ashbyhq.com/${slug}`,
  scraperType: "ashby",
  isActive: true,
});

const pending = (careersUrl) => ({
  url: careersUrl,
  scraperType: "unsupported",
  isActive: false,
});

const tcsIbegin = () => ({
  url: "https://ibegin.tcsapps.com/candidate/jobs/search",
  scraperType: "tcs-ibegin",
  isActive: true,
});

const infosysSmartdreamers = () => ({
  url: "https://digitalcareers.infosys.com/infosys/global-careers",
  scraperType: "smartdreamers",
  isActive: true,
});

const wiproRss = () => ({
  url: "https://careers.wipro.com/services/rss/job/?locale=en_US&keywords=locationSearch:(India)",
  scraperType: "successfactors-rss",
  isActive: true,
});

export const INDIA_COMPANY_SOURCES = [
  // Indian IT services & consulting (1-15)
  { companyName: "TCS", name: "TCS iBegin", ...tcsIbegin() },
  { companyName: "Infosys", name: "Infosys Careers", ...infosysSmartdreamers() },
  { companyName: "Wipro", name: "Wipro Careers", ...wiproRss() },
  { companyName: "HCL Technologies", name: "HCL Careers", careersUrl: "https://www.hcltech.com/careers" },
  { companyName: "Tech Mahindra", name: "Tech Mahindra Careers", careersUrl: "https://careers.techmahindra.com" },
  { companyName: "LTIMindtree", name: "LTIMindtree Careers", careersUrl: "https://www.ltimindtree.com/careers" },
  { companyName: "Mphasis", name: "Mphasis Careers", careersUrl: "https://careers.mphasis.com" },
  { companyName: "Persistent Systems", name: "Persistent Careers", careersUrl: "https://www.persistent.com/careers" },
  { companyName: "Coforge", name: "Coforge Careers", careersUrl: "https://www.coforge.com/careers" },
  { companyName: "Hexaware", name: "Hexaware Careers", careersUrl: "https://hexaware.com/careers" },
  { companyName: "Cyient", name: "Cyient Careers", careersUrl: "https://www.cyient.com/careers" },
  { companyName: "Zensar", name: "Zensar Careers", careersUrl: "https://www.zensar.com/careers" },
  { companyName: "Birlasoft", name: "Birlasoft Careers", careersUrl: "https://www.birlasoft.com/careers" },
  { companyName: "Sonata Software", name: "Sonata Careers", careersUrl: "https://www.sonata-software.com/careers" },
  { companyName: "Happiest Minds", name: "Happiest Minds Careers", careersUrl: "https://www.happiestminds.com/careers" },

  // Indian product & startups (16-40)
  { companyName: "Flipkart", name: "Flipkart Careers", careersUrl: "https://www.flipkartcareers.com" },
  { companyName: "Swiggy", name: "Swiggy Careers", careersUrl: "https://careers.swiggy.com" },
  { companyName: "Zomato", name: "Zomato Careers", careersUrl: "https://www.zomato.com/careers" },
  { companyName: "Razorpay", name: "Razorpay Careers", careersUrl: "https://razorpay.com/jobs" },
  { companyName: "PhonePe", name: "PhonePe Careers", careersUrl: "https://www.phonepe.com/careers", ...greenhouse("phonepe") },
  { companyName: "Paytm", name: "Paytm Careers", careersUrl: "https://careers.paytm.com", ...lever("paytm") },
  { companyName: "Ola", name: "Ola Careers", careersUrl: "https://www.olacabs.com/careers" },
  { companyName: "CRED", name: "CRED Careers", careersUrl: "https://careers.cred.club", ...lever("cred") },
  { companyName: "Meesho", name: "Meesho Careers", careersUrl: "https://careers.meesho.com", ...lever("meesho") },
  { companyName: "Zerodha", name: "Zerodha Careers", careersUrl: "https://zerodha.com/careers" },
  { companyName: "Freshworks", name: "Freshworks Careers", careersUrl: "https://www.freshworks.com/company/careers" },
  { companyName: "Zoho", name: "Zoho Careers", careersUrl: "https://www.zoho.com/careers" },
  { companyName: "Postman", name: "Postman Careers", careersUrl: "https://www.postman.com/company/careers", ...greenhouse("postman") },
  { companyName: "BrowserStack", name: "BrowserStack Careers", careersUrl: "https://www.browserstack.com/careers" },
  { companyName: "Chargebee", name: "Chargebee Careers", careersUrl: "https://www.chargebee.com/careers" },
  { companyName: "Dream11", name: "Dream11 Careers", careersUrl: "https://www.dreamsports.group/careers" },
  { companyName: "Nykaa", name: "Nykaa Careers", careersUrl: "https://www.nykaa.com/careers" },
  { companyName: "Policybazaar", name: "Policybazaar Careers", careersUrl: "https://www.policybazaar.com/careers" },
  { companyName: "Delhivery", name: "Delhivery Careers", careersUrl: "https://www.delhivery.com/careers" },
  { companyName: "Oyo", name: "Oyo Careers", careersUrl: "https://www.oyorooms.com/careers" },
  { companyName: "Urban Company", name: "Urban Company Careers", careersUrl: "https://careers.urbancompany.com" },
  { companyName: "ShareChat", name: "ShareChat Careers", careersUrl: "https://sharechat.com/careers" },
  { companyName: "InMobi", name: "InMobi Careers", careersUrl: "https://www.inmobi.com/company/careers", ...greenhouse("inmobi") },
  { companyName: "Unacademy", name: "Unacademy Careers", careersUrl: "https://unacademy.com/careers" },
  { companyName: "Lenskart", name: "Lenskart Careers", careersUrl: "https://www.lenskart.com/careers" },

  // Global tech MNCs (41-70)
  { companyName: "Google", name: "Google India Careers", careersUrl: "https://careers.google.com" },
  { companyName: "Microsoft", name: "Microsoft India Careers", careersUrl: "https://careers.microsoft.com" },
  { companyName: "Amazon", name: "Amazon India Careers", careersUrl: "https://www.amazon.jobs" },
  { companyName: "Apple", name: "Apple India Careers", careersUrl: "https://www.apple.com/careers" },
  { companyName: "Meta", name: "Meta Careers", careersUrl: "https://www.metacareers.com" },
  { companyName: "Adobe", name: "Adobe Careers", careersUrl: "https://careers.adobe.com" },
  { companyName: "Salesforce", name: "Salesforce Careers", careersUrl: "https://careers.salesforce.com" },
  { companyName: "Oracle", name: "Oracle Careers", careersUrl: "https://careers.oracle.com" },
  { companyName: "SAP", name: "SAP Careers", careersUrl: "https://jobs.sap.com" },
  { companyName: "IBM", name: "IBM Careers", careersUrl: "https://www.ibm.com/careers" },
  { companyName: "Intel", name: "Intel Careers", careersUrl: "https://jobs.intel.com" },
  { companyName: "NVIDIA", name: "NVIDIA Careers", careersUrl: "https://nvidia.wd5.myworkdayjobs.com" },
  { companyName: "AMD", name: "AMD Careers", careersUrl: "https://careers.amd.com" },
  { companyName: "Cisco", name: "Cisco Careers", careersUrl: "https://jobs.cisco.com" },
  { companyName: "VMware", name: "VMware Careers", careersUrl: "https://broadcom.wd1.myworkdayjobs.com/en-US/External_Career", scraperType: "workday", url: "https://broadcom.wd1.myworkdayjobs.com/en-US/External_Career", isActive: true },
  { companyName: "Dell Technologies", name: "Dell Careers", careersUrl: "https://iawmqy.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/careers/jobs?lastSelectedFacet=TITLES&location=India&locationId=300000000471053&locationLevel=country&mode=location&selectedTitlesFacet=ENGREDEV%3BENGINEERING+SERVICES" },
  { companyName: "HP", name: "HP Careers", careersUrl: "https://jobs.hp.com" },
  { companyName: "LinkedIn", name: "LinkedIn Careers", careersUrl: "https://careers.linkedin.com", ...greenhouse("linkedin") },
  { companyName: "Uber", name: "Uber Careers", careersUrl: "https://www.uber.com/us/en/careers" },
  { companyName: "Airbnb", name: "Airbnb Careers", careersUrl: "https://careers.airbnb.com", ...greenhouse("airbnb") },
  { companyName: "Netflix", name: "Netflix Careers", careersUrl: "https://jobs.netflix.com" },
  { companyName: "Spotify", name: "Spotify Careers", careersUrl: "https://www.lifeatspotify.com", ...lever("spotify") },
  { companyName: "Stripe", name: "Stripe Careers", careersUrl: "https://stripe.com/jobs", ...greenhouse("stripe") },
  { companyName: "Atlassian", name: "Atlassian Careers", careersUrl: "https://www.atlassian.com/company/careers", ...lever("atlassian") },
  { companyName: "ServiceNow", name: "ServiceNow Careers", careersUrl: "https://careers.servicenow.com" },
  { companyName: "Intuit", name: "Intuit Careers", careersUrl: "https://www.intuit.com/careers" },
  { companyName: "PayPal", name: "PayPal Careers", careersUrl: "https://careers.pypl.com" },
  { companyName: "Goldman Sachs", name: "Goldman Sachs Careers", careersUrl: "https://www.goldmansachs.com/careers" },
  { companyName: "Morgan Stanley", name: "Morgan Stanley Careers", careersUrl: "https://morganstanley.tal.net" },

  // Global product & SaaS (71-90)
  { companyName: "Notion", name: "Notion Careers", careersUrl: "https://www.notion.so/careers", ...ashby("notion") },
  { companyName: "Figma", name: "Figma Careers", careersUrl: "https://www.figma.com/careers", ...greenhouse("figma") },
  { companyName: "Canva", name: "Canva Careers", careersUrl: "https://www.canva.com/careers" },
  { companyName: "Shopify", name: "Shopify Careers", careersUrl: "https://www.shopify.com/careers" },
  { companyName: "Twilio", name: "Twilio Careers", careersUrl: "https://www.twilio.com/company/jobs", ...greenhouse("twilio") },
  { companyName: "Databricks", name: "Databricks Careers", careersUrl: "https://www.databricks.com/company/careers", ...greenhouse("databricks") },
  { companyName: "Snowflake", name: "Snowflake Careers", careersUrl: "https://careers.snowflake.com", ...ashby("snowflake") },
  { companyName: "MongoDB", name: "MongoDB Careers", careersUrl: "https://www.mongodb.com/careers", ...greenhouse("mongodb") },
  { companyName: "Elastic", name: "Elastic Careers", careersUrl: "https://www.elastic.co/careers", ...greenhouse("elastic") },
  { companyName: "GitHub", name: "GitHub Careers", careersUrl: "https://github.com/careers" },
  { companyName: "GitLab", name: "GitLab Careers", careersUrl: "https://about.gitlab.com/jobs", ...greenhouse("gitlab") },
  { companyName: "HashiCorp", name: "HashiCorp Careers", careersUrl: "https://www.hashicorp.com/careers" },
  { companyName: "Cloudflare", name: "Cloudflare Careers", careersUrl: "https://www.cloudflare.com/careers", ...greenhouse("cloudflare") },
  { companyName: "Datadog", name: "Datadog Careers", careersUrl: "https://careers.datadoghq.com", ...greenhouse("datadog") },
  { companyName: "Splunk", name: "Splunk Careers", careersUrl: "https://www.splunk.com/en_us/careers.html" },
  { companyName: "Palo Alto Networks", name: "Palo Alto Networks Careers", careersUrl: "https://jobs.paloaltonetworks.com" },
  { companyName: "CrowdStrike", name: "CrowdStrike Careers", careersUrl: "https://www.crowdstrike.com/careers" },
  { companyName: "Okta", name: "Okta Careers", careersUrl: "https://www.okta.com/company/careers", ...greenhouse("okta") },
  { companyName: "Workday", name: "Workday Careers", careersUrl: "https://careers.workday.com" },
  { companyName: "Zendesk", name: "Zendesk Careers", careersUrl: "https://www.zendesk.com/company/careers" },

  // Indian banks, fintech & enterprises (91-100)
  { companyName: "ICICI Bank", name: "ICICI Bank Careers", careersUrl: "https://www.icicicareers.com" },
  { companyName: "HDFC Bank", name: "HDFC Bank Careers", careersUrl: "https://www.hdfcbank.com/personal/about-us/careers" },
  { companyName: "Axis Bank", name: "Axis Bank Careers", careersUrl: "https://www.axisbank.com/careers" },
  { companyName: "Kotak Mahindra Bank", name: "Kotak Careers", careersUrl: "https://www.kotak.bank.in/en/about-us/careers.html" },
  { companyName: "Jio Platforms", name: "Jio Careers", careersUrl: "https://careers.jio.com" },
  { companyName: "Tata Digital", name: "Tata Digital Careers", careersUrl: "https://www.tataneu.com/careers" },
  { companyName: "Reliance Retail", name: "Reliance Retail Careers", careersUrl: "https://relianceretail.com/careers.html" },
  { companyName: "Mahindra & Mahindra", name: "Mahindra Careers", careersUrl: "https://www.mahindra.com/careers" },
  { companyName: "Bajaj Finserv", name: "Bajaj Finserv Careers", careersUrl: "https://www.bajajfinserv.in/careers" },
  { companyName: "Udaan", name: "Udaan Careers", careersUrl: "https://careers.udaan.com" },
  { companyName: "Palantir", name: "Palantir Careers", careersUrl: "https://www.palantir.com/careers", ...lever("palantir") },
];
