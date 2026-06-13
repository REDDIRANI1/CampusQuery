const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1280, height: 1024 });

  // 1. Capture Student Dashboard
  console.log("Navigating to Student Dashboard...");
  await page.goto('http://localhost:3002/student/dashboard');
  await page.waitForTimeout(1000);
  
  // Fill the student UUID and click Lookup
  await page.fill('input[placeholder="Enter your Student UUID"]', '16cd6102-5b39-4b20-b33c-734357ab012f');
  await page.click('button:has-text("Lookup")');
  await page.waitForSelector('h2:has-text("Alice Williams")');
  console.log("Loaded Alice Williams dashboard.");
  
  // Take screenshot
  await page.screenshot({ path: '/Users/salauddin/Projects/workspace/assessments/student-portal/task1_student_dashboard.png' });
  console.log("Saved task1_student_dashboard.png");

  // 2. Capture AI SQL Assistant with Query Results
  console.log("Navigating to AI SQL Assistant...");
  await page.goto('http://localhost:3002/sql-assistant');
  await page.waitForTimeout(2000);

  // Click on the sample dataset
  const datasetBtn = page.locator("button:has-text('sample_dataset.csv')");
  if (await datasetBtn.count() > 0) {
    await datasetBtn.first().click();
    console.log("Selected sample dataset.");
    await page.waitForTimeout(1000);
  } else {
    console.log("Warning: sample_dataset.csv button not found.");
  }

  // Type query and run
  await page.fill("input[placeholder*='E.g.,']", "Show top 3 students by marks");
  await page.click("button:has-text('Run Query')");
  console.log("Running SQL Assistant query...");

  // Wait for response table/AI insight
  await page.waitForSelector("h4:has-text('AI Insight')", { timeout: 15000 });
  await page.waitForTimeout(1000);
  console.log("Loaded SQL Assistant query results.");

  // Take screenshot
  await page.screenshot({ path: '/Users/salauddin/Projects/workspace/assessments/student-portal/task2_sql_assistant.png' });
  console.log("Saved task2_sql_assistant.png");

  await browser.close();
})();
