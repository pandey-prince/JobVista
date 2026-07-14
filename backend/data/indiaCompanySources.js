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
  { companyName: "HCL Technologies", name: "HCL Careers", careersUrl: "https://careers.hcltech.com/search/?q=software+engineer&locationsearch=&searchResultView=LIST&markerViewed=&carouselIndex=&facetFilters=%7B%22custCountryRegion%22%3A%5B%22India%22%5D%7D&pageNumber=0&sortBy=" },
  { companyName: "Tech Mahindra", name: "Tech Mahindra Careers", careersUrl: "https://careers.techmahindra.com/CurrentOpportunity.aspx" },
  { companyName: "LTIMindtree", name: "LTIMindtree Careers", careersUrl: "https://ltimindtree.ripplehire.com/candidate/?token=xviyQvbnyYZdGtozXoNm&lang=en&source=CAREERSITE#list/geo=India" },
  { companyName: "Mphasis", name: "Mphasis Careers", careersUrl: "https://mphasis.ripplehire.com/candidate/?token=ty4DfyWddnOrtpclQeia&source=CAREERSITE#list/function=IT%20Application%20Services&geo=IND" },
  { companyName: "Persistent Systems", name: "Persistent Careers", careersUrl: "https://careers.persistent.com/explore-opportunities" },
  { companyName: "Coforge", name: "Coforge Careers", careersUrl: "https://careers.coforge.com/coforge" },
  { companyName: "Hexaware", name: "Hexaware Careers", careersUrl: "https://jobs.hexaware.com/#en/sites/CX_1/jobs?location=India&locationId=300000000446279&locationLevel=country&mode=location" },
  { companyName: "Cyient", name: "Cyient Careers", careersUrl: "https://www.cyient.com/careers" },
  { companyName: "Zensar", name: "Zensar Careers", careersUrl: "https://fa-etvl-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/jobs?keyword=Software+Engineer&lastSelectedFacet=LOCATIONS&mode=location&selectedLocationsFacet=300000000435151" },
  { companyName: "Birlasoft", name: "Birlasoft Careers", careersUrl: "https://jobs.birlasoft.com/search/?createNewAlert=false&q=software+engineer&optionsFacetsDD_country=IN&optionsFacetsDD_department=" },
  { companyName: "Sonata Software", name: "Sonata Careers", careersUrl: "https://sonataone.darwinbox.in/ms/candidatev2/main/careers/allJobs" },
  { companyName: "Happiest Minds", name: "Happiest Minds Careers", careersUrl: "https://jobs.happiestminds.com/happiestminds" },

  // Indian product & startups (16-40)
  { companyName: "Flipkart", name: "Flipkart Careers", careersUrl: "https://flipkart.turbohire.co/dashboardv2?orgId=4d757ba0-3d57-448a-b82c-238ed87ac90f&type=0" },
  { companyName: "Swiggy", name: "Swiggy Careers", careersUrl: "https://careers.swiggy.com/#/careers?src=careers&career_page_category=Technology" },
  { companyName: "Zomato", name: "Zomato Careers", careersUrl: "https://www.zomato.com/careers" },
  { companyName: "Razorpay", name: "Razorpay Careers", careersUrl: "https://job-boards.greenhouse.io/razorpaysoftwareprivatelimited?departments%5B%5D=4024806005" },
  { companyName: "PhonePe", name: "PhonePe Careers", careersUrl: "https://job-boards.greenhouse.io/phonepe", ...greenhouse("phonepe") },
  { companyName: "Paytm", name: "Paytm Careers", careersUrl: "https://jobs.lever.co/paytm", ...lever("paytm") },
  { companyName: "Ola", name: "Ola Careers", careersUrl: "https://www.olacabs.com/careers" },
  { companyName: "CRED", name: "CRED Careers", careersUrl: "https://jobs.lever.co/cred", ...lever("cred") },
  { companyName: "Meesho", name: "Meesho Careers", careersUrl: "https://jobs.lever.co/meesho?department=Tech", ...lever("meesho") },
  { companyName: "Zerodha", name: "Zerodha Careers", careersUrl: "https://zerodha.com/careers" },
  { companyName: "Freshworks", name: "Freshworks Careers", careersUrl: "https://careers.smartrecruiters.com/Freshworks" },
  { companyName: "Zoho", name: "Zoho Careers", careersUrl: "https://www.zoho.com/careers" },
  { companyName: "Postman", name: "Postman Careers", careersUrl: "https://job-boards.greenhouse.io/postman?offices%5B%5D=4033388003&departments%5B%5D=4125444003&departments%5B%5D=4060249003&departments%5B%5D=4057268003&departments%5B%5D=4093109003", ...greenhouse("postman") },
  { companyName: "BrowserStack", name: "BrowserStack Careers", careersUrl: "https://browserstack.wd3.myworkdayjobs.com/en-US/External?locations=07564020a4451005a3027f2ca2d60000" },
  { companyName: "Chargebee", name: "Chargebee Careers", careersUrl: "https://www.chargebee.com/careers" },
  { companyName: "Dream11", name: "Dream11 Careers", careersUrl: "https://www.dreamsports.group/careers" },
  { companyName: "Nykaa", name: "Nykaa Careers", careersUrl: "https://www.nykaa.com/careers" },
  { companyName: "Policybazaar", name: "Policybazaar Careers", careersUrl: "https://www.policybazaar.com/careers" },
  { companyName: "Delhivery", name: "Delhivery Careers", careersUrl: "https://delhivery.darwinbox.in/ms/candidatev2/main/careers/allJobs" },
  { companyName: "Oyo", name: "Oyo Careers", careersUrl: "https://www.oyorooms.com/careers" },
  { companyName: "Urban Company", name: "Urban Company Careers", careersUrl: "https://careers.urbancompany.com/jobs?department=Engineering%20%26%20Data" },
  { companyName: "ShareChat", name: "ShareChat Careers", careersUrl: "https://sharechat.com/careers" },
  { companyName: "InMobi", name: "InMobi Careers", careersUrl: "https://job-boards.greenhouse.io/inmobi?offices%5B%5D=84644", ...greenhouse("inmobi") },
  { companyName: "Unacademy", name: "Unacademy Careers", careersUrl: "https://unacademy.com/careers" },
  { companyName: "Lenskart", name: "Lenskart Careers", careersUrl: "https://www.lenskart.com/careers-at-lenskart" },

  // Global tech MNCs (41-70)
  { companyName: "Google", name: "Google India Careers", careersUrl: "https://www.google.com/about/careers/applications/jobs/results/?q=(%22Software%20Engineer%22%20OR%20%22Software%20Developer%22%20OR%20%22Full%20Stack%20Engineer%22)%20AND%20(%22Distributed%20Systems%22%20OR%20%22Microservices%22%20OR%20%22API%20Design%22%20OR%20%22Cloud%20Architecture%22%20OR%20%22Frontend%22%20OR%20%22Backend%22%20OR%20%22DevOps%22%20OR%20%22CI%2FCD%22%20OR%20%22Scalability%22%20OR%20%22System%20Design%22%20OR%20AI)&e=72477625&target_level=EARLY&target_level=ADVANCED&target_level=MID&location=India&company=GFiber&company=Verily%20Life%20Sciences&company=Wing&company=Waymo&company=DeepMind&company=YouTube&company=Google&employment_type=INTERN&employment_type=FULL_TIME" },
  { companyName: "Microsoft", name: "Microsoft India Careers", careersUrl: "https://apply.careers.microsoft.com/careers?start=0&location=India&pid=1970393556911730&sort_by=distance&filter_include_remote=1&filter_profession=software+engineering" },
  { companyName: "Amazon", name: "Amazon India Careers", careersUrl: "https://www.amazon.jobs/en/search?offset=0&result_limit=10&sort=relevant&category%5B%5D=operations-it-support-engineering&category%5B%5D=software-development&category%5B%5D=solutions-architect&country%5B%5D=IND&distanceType=Mi&radius=24km&latitude=&longitude=&loc_group_id=&loc_query=&base_query=&city=&country=&region=&county=&query_options=&" },
  { companyName: "Apple", name: "Apple India Careers", careersUrl: "https://jobs.apple.com/en-in/search?location=india-INDC" },
  { companyName: "Meta", name: "Meta Careers", careersUrl: "https://www.metacareers.com/jobsearch/?teams[0]=Artificial%20Intelligence&teams[1]=Software%20Engineering&teams[2]=Internship%20-%20Engineering%2C%20Tech%20%26%20Design&teams[3]=University%20Grad%20-%20Engineering%2C%20Tech%20%26%20Design&offices[0]=Mumbai%2C%20India&offices[1]=Gurgaon%2C%20India&offices[2]=Bangalore%2C%20India&offices[3]=Hyderabad%2C%20India&offices[4]=New%20Delhi%2C%20India" },
  { companyName: "Adobe", name: "Adobe Careers", careersUrl: "https://careers.adobe.com/us/en/search-results" },
  { companyName: "Salesforce", name: "Salesforce Careers", careersUrl: "https://www.salesforce.com/company/careers/jobs/?country=India&team=Software+Engineering&page=1" },
  { companyName: "Oracle", name: "Oracle Careers", careersUrl: "https://careers.oracle.com/en/sites/jobsearch/jobs?lastSelectedFacet=LOCATIONS&location=India&locationId=300000000106947&locationLevel=country&mode=location&selectedLocationsFacet=300000000106947" },
  { companyName: "SAP", name: "SAP Careers", careersUrl: "https://jobs.sap.com/search/?createNewAlert=false&q=&locationsearch=&optionsFacetsDD_department=&optionsFacetsDD_customfield3=&optionsFacetsDD_country=IN" },
  { companyName: "IBM", name: "IBM Careers", careersUrl: "https://www.ibm.com/in-en/careers/search?field_keyword_08[0]=Software%20Engineering&field_keyword_05[0]=India" },
  { companyName: "Intel", name: "Intel Careers", careersUrl: "https://intel.wd1.myworkdayjobs.com/External?locations=1e4a4eb3adf101f44070f976bf8184cf&jobFamilyGroup=ace7a3d23b7e01a0544279031a0ec85c" },
  { companyName: "NVIDIA", name: "NVIDIA Careers", careersUrl: "https://jobs.nvidia.com/careers?query=India&start=0&location=india&pid=893394697226&sort_by=relevance&filter_include_remote=1&filter_job_category=engineering%2Cit+-+information+technology&filter_job_type=new+college+graduate%2Cregular+employee%2Cintern+%28fixed+term%29%2Cacademic+%28fixed+term%29%2Cregular+employee+%28fixed+term%29" },
  { companyName: "AMD", name: "AMD Careers", careersUrl: "https://careers.amd.com/careers-home/jobs?page=1&limit=100&country=India&categories=Engineering" },
  { companyName: "Cisco", name: "Cisco Careers", careersUrl: "https://careers.cisco.com/global/en/search-results" },
  { companyName: "VMware", name: "VMware Careers", careersUrl: "https://broadcom.wd1.myworkdayjobs.com/en-US/External_Career?locations=2d466ab4e6e0013cf503069082349dd2&locations=0dd627624e2e0176f301cad8dcd9ab0b&locations=877d747df71910021363ea290d900000&locations=2a204116f85f01189cd964af936b70fb&locations=752a3c9efe39105be2259b2c18d3b6e4", scraperType: "workday", url: "https://broadcom.wd1.myworkdayjobs.com/en-US/External_Career", isActive: true },
  { companyName: "Dell Technologies", name: "Dell Careers", careersUrl: "https://iawmqy.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/careers/jobs?lastSelectedFacet=TITLES&location=India&locationId=300000000471053&locationLevel=country&mode=location&selectedTitlesFacet=ENGREDEV%3BENGINEERING+SERVICES" },
  { companyName: "HP", name: "HP Careers", careersUrl: "https://apply.hp.com/careers?start=0&location=india&pid=42077320&sort_by=distance&filter_include_remote=1&filter_job_category=engineering%2Csoftware%2Cengineering+services" },
  { companyName: "LinkedIn", name: "LinkedIn Careers", careersUrl: "https://boards.greenhouse.io/linkedin", ...greenhouse("linkedin") },
  { companyName: "Uber", name: "Uber Careers", careersUrl: "https://jobs.uber.com/en/jobs/?radius=100&team=Engineer" },
  { companyName: "Airbnb", name: "Airbnb Careers", careersUrl: "https://careers.airbnb.com/positions/?_departments=engineering&_where_you_work=india%2Cbangalore-india%2Cremote-bangalore-india", ...greenhouse("airbnb") },
  { companyName: "Netflix", name: "Netflix Careers", careersUrl: "https://jobs.netflix.com" },
  { companyName: "Spotify", name: "Spotify Careers", careersUrl: "https://www.lifeatspotify.com", ...lever("spotify") },
  { companyName: "Stripe", name: "Stripe Careers", careersUrl: "https://stripe.com/jobs", ...greenhouse("stripe") },
  { companyName: "Atlassian", name: "Atlassian Careers", careersUrl: "https://www.atlassian.com/company/careers/all-jobs?team=Atlassian%20Corporate%20Engineering%20%28ACE%29%2CEngineering%2CInterns&location=India&search=", ...lever("atlassian") },
  { companyName: "ServiceNow", name: "ServiceNow Careers", careersUrl: "https://careers.servicenow.com/jobs/?search=&team=Engineering%2C+Infrastructure+and+Operations&country=India&region=Haryana&region=Karnataka&region=Maharashtra&location=Bangalore&location=Gurgaon&location=Hyderabad&location=Mumbai&pagesize=20#results" },
  { companyName: "Intuit", name: "Intuit Careers", careersUrl: "https://www.intuit.com/careers" },
  { companyName: "PayPal", name: "PayPal Careers", careersUrl: "https://paypal.eightfold.ai/careers?domain=paypal.com&start=0&location=india&pid=274920809476&sort_by=distance&filter_include_remote=1&filter_job_category=Software+Engineering%2CData+Science%2CProduct+Management%2CMachine+Learning+Engineering" },
  { companyName: "Goldman Sachs", name: "Goldman Sachs Careers", careersUrl: "https://www.goldmansachs.com/careers" },
  { companyName: "Morgan Stanley", name: "Morgan Stanley Careers", careersUrl: "https://morganstanley.tal.net" },

  // Global product & SaaS (71-90)
  { companyName: "Notion", name: "Notion Careers", careersUrl: "https://www.notion.so/careers", ...ashby("notion") },
  { companyName: "Figma", name: "Figma Careers", careersUrl: "https://www.figma.com/careers/#job-openings", ...greenhouse("figma") },
  { companyName: "Canva", name: "Canva Careers", careersUrl: "https://www.canva.com/careers" },
  { companyName: "Shopify", name: "Shopify Careers", careersUrl: "https://www.shopify.com/careers" },
  { companyName: "Twilio", name: "Twilio Careers", careersUrl: "https://job-boards.greenhouse.io/twilio?departments%5B%5D=637&departments%5B%5D=55275&offices%5B%5D=66765&offices%5B%5D=85541", ...greenhouse("twilio") },
  { companyName: "Databricks", name: "Databricks Careers", careersUrl: "https://www.databricks.com/company/careers", ...greenhouse("databricks") },
  { companyName: "Snowflake", name: "Snowflake Careers", careersUrl: "https://careers.snowflake.com", ...ashby("snowflake") },
  { companyName: "MongoDB", name: "MongoDB Careers", careersUrl: "https://www.mongodb.com/company/careers/teams/engineering", ...greenhouse("mongodb") },
  { companyName: "Elastic", name: "Elastic Careers", careersUrl: "https://www.elastic.co/careers", ...greenhouse("elastic") },
  { companyName: "GitHub", name: "GitHub Careers", careersUrl: "https://www.github.careers/careers-home/jobs?locations=,,India&page=1" },
  { companyName: "GitLab", name: "GitLab Careers", careersUrl: "https://boards.greenhouse.io/gitlab", ...greenhouse("gitlab") },
  { companyName: "HashiCorp", name: "HashiCorp Careers", careersUrl: "https://www.hashicorp.com/careers" },
  { companyName: "Cloudflare", name: "Cloudflare Careers", careersUrl: "https://www.cloudflare.com/careers", ...greenhouse("cloudflare") },
  { companyName: "Datadog", name: "Datadog Careers", careersUrl: "https://careers.datadoghq.com", ...greenhouse("datadog") },
  { companyName: "Splunk", name: "Splunk Careers", careersUrl: "https://www.splunk.com/en_us/careers.html" },
  { companyName: "Palo Alto Networks", name: "Palo Alto Networks Careers", careersUrl: "https://jobs.paloaltonetworks.com" },
  { companyName: "CrowdStrike", name: "CrowdStrike Careers", careersUrl: "https://crowdstrike.wd5.myworkdayjobs.com/crowdstrikecareers?locationCountry=c4f78be1a8f14da0ab49ce1162348a5e&Job_Family=1408861ee6e201b287b816f7b000020c&Job_Family=1408861ee6e201641be2c2f6b000c00b&Job_Family=1408861ee6e20197f95adbf6b000d20b&Job_Family=cb19f044639b1001f6a02595bc920000" },
  { companyName: "Okta", name: "Okta Careers", careersUrl: "https://www.okta.com/company/careers/job-listing/?department=4183&location=5997", ...greenhouse("okta") },
  { companyName: "Workday", name: "Workday Careers", careersUrl: "https://careers.workday.com" },
  { companyName: "Zendesk", name: "Zendesk Careers", careersUrl: "https://zendesk.wd1.myworkdayjobs.com/en-US/zendesk?locationCountry=c4f78be1a8f14da0ab49ce1162348a5e&jobFamilyGroup=5c7e2781e58b013cfae0600047618a63" },

  // Indian banks, fintech & enterprises (91-100)
  { companyName: "ICICI Bank", name: "ICICI Bank Careers", careersUrl: "https://www.icicicareers.com" },
  { companyName: "HDFC Bank", name: "HDFC Bank Careers", careersUrl: "https://www.hdfcbank.com/personal/about-us/careers" },
  { companyName: "Axis Bank", name: "Axis Bank Careers", careersUrl: "https://www.axisbank.com/careers" },
  { companyName: "Kotak Mahindra Bank", name: "Kotak Careers", careersUrl: "https://www.kotak.bank.in/en/about-us/careers/tech-jobs.html" },
  { companyName: "Jio Platforms", name: "Jio Careers", careersUrl: "https://careers.jio.com" },
  { companyName: "Tata Digital", name: "Tata Digital Careers", careersUrl: "https://www.tataneu.com/careers" },
  { companyName: "Reliance Retail", name: "Reliance Retail Careers", careersUrl: "https://relianceretail.com/careers.html" },
  { companyName: "Mahindra & Mahindra", name: "Mahindra Careers", careersUrl: "https://jobs.mahindracareers.com/search/?createNewAlert=false&q=&locationsearch=IN&optionsFacetsDD_shifttype=&optionsFacetsDD_facility=Information+Technology&optionsFacetsDD_customfield1=" },
  { companyName: "Bajaj Finserv", name: "Bajaj Finserv Careers", careersUrl: "https://bflcareers.peoplestrong.com/job/joblist" },
  { companyName: "Udaan", name: "Udaan Careers", careersUrl: "https://careers.udaan.com" },
  { companyName: "Palantir", name: "Palantir Careers", careersUrl: "https://www.palantir.com/careers", ...lever("palantir") },
];
