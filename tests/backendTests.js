const http = require("http");

function testAPI(path, expectedStatus) {
    return new Promise((resolve, reject) => {
        http.get(
            `http://localhost:5001${path}`,
            (response) => {
                console.log(
                    `${path} → Status: ${response.statusCode}`
                );

                if (response.statusCode === expectedStatus) {
                    resolve();
                } else {
                    reject(
                        new Error(
                            `${path} returned ${response.statusCode}`
                        )
                    );
                }
            }
        ).on("error", reject);
    });
}

async function runTests() {
    try {
        await testAPI("/", 200);
        await testAPI("/api/test-db", 200);
        await testAPI("/api/scenarios", 200);

        console.log("All backend API tests passed!");
    } catch (error) {
        console.error("Backend test failed:", error.message);
    }
}

runTests();