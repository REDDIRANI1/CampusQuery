import { test } from '@playwright/test';

test('capture screenshots', async ({ page }) => {
  // Set viewport
  await page.setViewportSize({ width: 1280, height: 1024 });

  // 1. Student Registration
  console.log("Navigating to student registration...");
  await page.goto('http://localhost:3002/apply');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/salauddin/Projects/workspace/assessments/student-portal/task1_student_registration.png' });
  console.log("Saved task1_student_registration.png");

  // 2. Student Dashboard
  console.log("Navigating to student dashboard...");
  await page.goto('http://localhost:3002/student/dashboard');
  await page.waitForTimeout(1000);
  await page.fill('input[placeholder="Enter your Student UUID"]', '16cd6102-5b39-4b20-b33c-734357ab012f');
  await page.click('button:has-text("Lookup")');
  await page.waitForSelector('h2:has-text("Alice Williams")');
  await page.screenshot({ path: '/Users/salauddin/Projects/workspace/assessments/student-portal/task1_student_dashboard.png' });
  console.log("Saved task1_student_dashboard.png");

  // 3. Admin Dashboard
  console.log("Navigating to admin dashboard...");
  await page.goto('http://localhost:3002/admin');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/salauddin/Projects/workspace/assessments/student-portal/task1_admin_dashboard.png' });
  console.log("Saved task1_admin_dashboard.png");

  // 4. SQL Assistant
  console.log("Navigating to SQL Assistant...");
  await page.goto('http://localhost:3002/sql-assistant');
  await page.waitForTimeout(2000);
  // Select dataset or upload it if not present
  const datasetBtn = page.locator("button:has-text('sample_dataset.csv')");
  if (await datasetBtn.count() === 0) {
    console.log("Dataset not found, uploading sample_dataset.csv...");
    await page.setInputFiles('input[type="file"]', '/Users/salauddin/Projects/workspace/assessments/student-portal/sample_dataset.csv');
    await page.waitForSelector("button:has-text('sample_dataset.csv')", { timeout: 15000 });
    console.log("Upload completed!");
  }
  
  // Click on the sample dataset
  await page.locator("button:has-text('sample_dataset.csv')").first().click();
  console.log("Selected sample dataset.");
  await page.waitForTimeout(1000);

  // Fill query
  await page.fill("input[placeholder*='E.g.,']", "Show top 3 students by marks");
  await page.click("button:has-text('Run Query')");
  await page.waitForSelector("h4:has-text('AI Insight')", { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/salauddin/Projects/workspace/assessments/student-portal/task2_sql_assistant.png' });
  console.log("Saved task2_sql_assistant.png");
});
