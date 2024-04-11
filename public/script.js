// Initialize socket.io connection
const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
});
let myVideoStream;
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};
let meetingAttendees = {}; // New variable to store meeting attendees and their joining times

// Function to record the time when a person joins the meeting
function recordJoiningTime(userId) {
  console.log("Recording joining time for user:", userId);
  const currentTime = new Date();
  const formattedCurrentTime = currentTime.toLocaleString();
  meetingAttendees[userId] = {
    joinTime: currentTime,
    formattedJoinTime: formattedCurrentTime
  };
  updateMeetingTimes(); // Call the function to update the displayed meeting times
}

// Function to calculate the duration since joining the meeting
function calculateDuration(joinTime) {
  const currentTime = new Date();
  const diffInMilliseconds = currentTime - joinTime;
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60)); // Difference in minutes
  return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`;
}
setInterval(updateMeetingTimes, 1000);
// Function to update the displayed meeting times
// Function to update the displayed meeting times
// Function to update the displayed meeting times
function updateMeetingTimes() {
  const meetingTimesDiv = document.getElementById("meetingTimes");
  meetingTimesDiv.innerHTML = "<h2>Meeting Times:</h2>";
  const currentTime = new Date().toLocaleString(); // Get current time
  meetingTimesDiv.innerHTML += `<p>Current time: ${currentTime}</p>`; // Display current time
  for (let userId in meetingAttendees) {
    const { joinTime, formattedJoinTime } = meetingAttendees[userId];
    const duration = calculateDuration(joinTime);
    const currentTimeForUser = new Date().toLocaleString(); // Get current time for this user
    const attendancePercentage = calculateAttendancePercentage(joinTime); // Calculate attendance percentage
    const presentStatus = attendancePercentage >= 80 ? 'Present' : 'Absent'; // Check if participant is present or absent
    meetingTimesDiv.innerHTML += `<p>User ${userId} joined the meeting at: ${formattedJoinTime} (Current time for user: ${currentTimeForUser}, ${duration} ago, ${attendancePercentage}% attendance - ${presentStatus})</p>`;
  }
}

// Function to calculate attendance percentage
function calculateAttendancePercentage(joinTime) {
  const currentTime = new Date();
  const totalTime = currentTime - joinTime;
  const elapsedTime = totalTime / (1000 * 60); // Elapsed time in minutes
  const meetingDuration = Object.keys(meetingAttendees).length * 10; // Assuming each meeting attendee needs to be present for 60 minutes
  const attendancePercentage = (elapsedTime / meetingDuration) * 100;
  return Math.round(attendancePercentage);
}




// Function to record the current user's meeting time
function recordMyTime() {
  console.log("Recording my meeting time...");
  const userId = myPeer.id;
  recordJoiningTime(userId);
}

// Get user media and add video stream
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);
  myPeer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', userId => {
    console.log("User connected:", userId);
    connectToNewUser(userId, stream);
    recordJoiningTime(userId); // Record the joining time when a user connects
  });

  // Other existing code for chat functionality...

});

// Function to connect to a new user
function connectToNewUser(userId, stream) {
  console.log("Connecting to new user:", userId);
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call;

  // Call updateMeetingTimes function after recording joining time
  recordJoiningTime(userId);
}

// Function to add video stream to the video grid
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

// Handle mute/unmute functionality
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

// Handle play/stop video functionality
const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

// Set button UI for mute
const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

// Set button UI for unmute
const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

// Set button UI for stop video
const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

// Set button UI for play video
const setPlayVideo = () => {
  const html = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

// Automatically scroll chat window to bottom
const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

// Listen for enter key to send chat message
$(document).keydown(function (e) {
  var text = $("#chat_message");
  if (e.which == 13 && text.val().length !== 0) {
    socket.emit('message', text.val());
    text.val('');
  }
});

// Listen for chat messages from server
socket.on("createMessage", message => {
  $("ul.messages").append(`<li class="message"><b>User:</b><br/>${message}</li>`);
  scrollToBottom();
});

// Event listener for leaving the meeting
$(".leave_meeting").click(() => {
  window.location.href = "leave_meeting.html"; // Redirect to leave meeting page
});

// Add event listener to the recordMyTime button
document.getElementById("recordMyTimeBtn").addEventListener("click", recordMyTime);
