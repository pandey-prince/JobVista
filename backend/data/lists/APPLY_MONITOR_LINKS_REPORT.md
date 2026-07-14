# Apply monitor links — local report

Generated: 2026-07-14T20:47:09.824Z

## Constraints
- Local apply only — **no git push / deploy** in this run
- LinkedIn company jobs URLs skipped

## Sanitize / apply stats
- JSON rows: **69**
- Dry run: **false**
- Skip mongo: **false**
- Applied: **66**
- Dry-run planned: **0**
- Skipped: **3**
- Errors: **0**
- HTTPS upgrades: **0**

### Skipped LinkedIn
- Chargebee: `https://www.linkedin.com/company/chargebee/jobs/?originalSubdomain=in`
- Oyo: `https://www.linkedin.com/company/oyo-rooms/jobs/`

### Other Mongo skips
- Citrix: url_owned_by_Splunk (`https://careers.cisco.com/global/en/search-results`)

## Catalog `/companies`
- Total entries: **171** (includes Citrix; Noida companies retained)
- First apply pass updated **60** URLs and added **1** (Citrix); this re-run was already in sync (**0** further updates)
- Still has Noida regions: **true**
- Catalog still lists Citrix with the shared Cisco search-results URL (UI only — not created as a JobSource; see Mongo skip)

## Seed / overrides
- indiaCompanySources careersUrl patches: **66**
- knownCareerBoards url patches: **10**
- puppeteerSelectors url patches: **3**

## Scraper detection matrix

| Company | Scraper | Active |
|---|---|---|
| TCS | tcs-ibegin | true |
| Infosys | auto-puppeteer | true |
| Wipro | successfactors-rss | true |
| HCL Technologies | successfactors-rss | true |
| Tech Mahindra | auto-puppeteer | true |
| LTIMindtree | auto-puppeteer | true |
| Mphasis | auto-puppeteer | true |
| Persistent Systems | auto-puppeteer | true |
| Coforge | auto-puppeteer | true |
| Hexaware | auto-puppeteer | true |
| Zensar | auto-puppeteer | true |
| Birlasoft | auto-puppeteer | true |
| Sonata Software | auto-puppeteer | true |
| Happiest Minds | auto-puppeteer | true |
| Flipkart | auto-puppeteer | true |
| Swiggy | smartrecruiters | true |
| Razorpay | greenhouse | true |
| PhonePe | greenhouse | true |
| Paytm | lever | true |
| CRED | lever | true |
| Meesho | lever | true |
| Zerodha | auto-puppeteer | true |
| Freshworks | smartrecruiters | true |
| Zoho | auto-puppeteer | true |
| Postman | greenhouse | true |
| BrowserStack | workday | true |
| Nykaa | auto-puppeteer | true |
| Policybazaar | auto-puppeteer | true |
| Delhivery | auto-puppeteer | true |
| Urban Company | auto-puppeteer | true |
| InMobi | greenhouse | true |
| Lenskart | auto-puppeteer | true |
| Google | greenhouse | true |
| Microsoft | auto-puppeteer | true |
| Amazon | auto-puppeteer | true |
| Apple | auto-puppeteer | true |
| Meta | auto-puppeteer | true |
| Adobe | workday | true |
| Salesforce | workday | true |
| Oracle | auto-puppeteer | true |
| SAP | successfactors-rss | true |
| IBM | auto-puppeteer | true |
| Intel | workday | true |
| NVIDIA | workday | true |
| AMD | auto-puppeteer | true |
| Cisco | workday | true |
| VMware | workday | true |
| Dell Technologies | auto-puppeteer | true |
| HP | workday | true |
| LinkedIn | greenhouse | true |
| Uber | smartrecruiters | true |
| Airbnb | greenhouse | true |
| Atlassian | lever | true |
| ServiceNow | smartrecruiters | true |
| PayPal | auto-puppeteer | true |
| Figma | greenhouse | true |
| Twilio | greenhouse | true |
| MongoDB | greenhouse | true |
| GitHub | auto-puppeteer | true |
| GitLab | greenhouse | true |
| Citrix | auto-puppeteer | true |
| CrowdStrike | workday | true |
| Okta | greenhouse | true |
| Zendesk | workday | true |
| Kotak Mahindra Bank | auto-puppeteer | true |
| Mahindra & Mahindra | auto-puppeteer | true |
| Bajaj Finserv | greenhouse | true |

## Smoke scrapes (API boards)

- **Paytm** [lever]: raw=229, eligible IT+India=27
- **PhonePe** [greenhouse]: raw=50, eligible IT+India=19
- **BrowserStack** [workday]: raw=35, eligible IT+India=1
- **LinkedIn** [greenhouse]: raw=53, eligible IT+India=0
- **CRED** [lever]: raw=4, eligible IT+India=1
- **GitLab** [greenhouse]: raw=165, eligible IT+India=40

## Sample Mongo sync
- **TCS**: success=true jobsFound=216 
- **Wipro**: success=true jobsFound=16 

## Mongo sanity
- Active same-company sources with multiple URLs among applied set: **0**
- Sample active docs after apply:
  - **PhonePe**: `https://job-boards.greenhouse.io/phonepe` (greenhouse, active=true)
  - **Paytm**: `https://jobs.lever.co/paytm` (lever, active=true)
  - **BrowserStack**: `https://browserstack.wd3.myworkdayjobs.com/en-US/External?locations=07564020a4451005a3027f2ca2d60000` (workday, active=true)
  - **Adobe**: `https://adobe.wd5.myworkdayjobs.com/en-US/external_experienced` (workday, active=true)
  - **Cisco**: `https://cisco.wd5.myworkdayjobs.com/en-US/Cisco_Careers` (workday, active=true)
  - **Dell Technologies**: `https://iawmqy.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/careers/jobs?lastSelectedFacet=TITLES&location=India&locationId=300000000471053&locationLevel=country&mode=location&selectedTitlesFacet=ENGREDEV%3BENGINEERING+SERVICES` (auto-puppeteer, active=true)

## Known risks
- LTIMindtree / Mphasis Ripplehire token URLs may expire
- Infosys URL is no longer digitalcareers SmartDreamers — likely auto-puppeteer
- Flipkart Turbohire / Adobe search-results / Cisco search may need better selectors
- Citrix currently uses the same Cisco careers URL
- Chargebee & Oyo LinkedIn URLs were not applied

## Deploy
Not deployed. Say **deploy** when you want push to production.
