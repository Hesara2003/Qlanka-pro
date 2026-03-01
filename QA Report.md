QueueLanka Pro – QA Report

Module: ServiceCenterController Unit Testing
Test Type: Backend Unit Testing
Test Frameworks: xUnit, Moq, FluentAssertions
Tester: Malindu Gurunada
________________________________________
1. Objective
To verify that the ServiceCenterController methods work as expected:
1.	GetAllServiceCenters() → returns all service centers.
2.	GetServiceCenterById(int id) → returns a specific service center or 404 NotFound for invalid IDs.
The tests are unit tests only, mocking the IServiceCenterService dependency.
________________________________________
2. ## Test Cases & Results

| Test Case                                        | Description                                            | Expected Result                       | Actual Result                        | Status |
|--------------------------------------------------|--------------------------------------------------------|---------------------------------------|--------------------------------------|--------|
| GetAllServiceCenters_ReturnsOk                   | Checks HTTP status code                                | 200 OK                                | 200 OK                               | Pass   |
| GetAllServiceCenters_ReturnsListOfServiceCenters | Checks response contains 2 service centers             | List with 2 items                     | List with 2 items                    | Pass   |
| GetServiceCenterById_ValidId_ReturnsOk           | Checks HTTP status code for valid id=1                 | 200 OK                                | 200 OK                               | Pass   |
| GetServiceCenterById_ValidId_ReturnsCorrectCenter| Checks returned object matches expected service center | ServiceCenter {Id=1, Name="Center A"} | Matches expected                     | Pass   |
| GetServiceCenterById_InvalidId_ReturnsNotFound   | Checks HTTP status code for invalid id=999             | 404 NotFound                          | 404 NotFound                         | Pass   |
________________________________________
3. Test Cases & Results
## Test Cases & Results

| Test Case                                        | Description                                            | Expected Result                              | Actual Result                          | Status |
|--------------------------------------------------|--------------------------------------------------------|----------------------------------------------|----------------------------------------|--------|
| GetAllServiceCenters_ReturnsOk                   | Checks HTTP status code                                | 200 OK                                       | 200 OK                                 | Pass   |
| GetAllServiceCenters_ReturnsListOfServiceCenters | Checks response contains 2 service centers             | List with 2 items                            | List with 2 items                      | Pass   |
| GetServiceCenterById_ValidId_ReturnsOk           | Checks HTTP status code for valid id=1                 | 200 OK                                       | 200 OK                                 | Pass   |
| GetServiceCenterById_ValidId_ReturnsCorrectCenter| Checks returned object matches expected service center | ServiceCenter {Id=1, Name="Center A"}        | Matches expected                       | Pass   |
| GetServiceCenterById_InvalidId_ReturnsNotFound   | Checks HTTP status code for invalid id=999             | 404 NotFound                                 | 404 NotFound                           | Pass   |
________________________________________
4. Key Design Choices
1.	Controller Creation Helper – CreateController() used to build mock + controller for reusability.
2.	Sample Data Helper – SampleCenter(int id) generates sample service center data to avoid repetition.
3.	Moq Setup – .Setup(...).ReturnsAsync(...) used to mock service responses.
4.	Assertions – FluentAssertions used for readable .Should().BeEquivalentTo(...) checks.
5.	Unit Tests Only – No WebApplicationFactory, HTTP clients, or integration testing.
________________________________________
5. Summary
All unit tests passed successfully, verifying that:
•	GetAllServiceCenters() correctly returns a list of service centers with 200 OK.
•	GetServiceCenterById() correctly handles both valid and invalid IDs.
The test setup is clean, beginner-friendly, and can be extended in future sprints for additional controller methods.

