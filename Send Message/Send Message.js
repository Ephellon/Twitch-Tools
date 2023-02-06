const messages = [
    "Message 1",
    "Message 2",
    "Message 3"
];

const sendMessage = message => {
    const currentTime = new Date();
    if(currentTime >= startTime && currentTime <= endTime) {
        console.log(`Sending message: ${message}`);
    } else {
        console.log("The current time is outside the set time range.");
    }
};

// Set the start and end times
let startTime = new Date("02/06/2023 9:00:00");
let endTime = new Date("02/06/2023 17:00:00");

// Call the sendMessage function
for(let index = 0; index < messages.length; ++index)
    setTimeout(sendMessage, index * 300_000, messages[index]); // 5 min