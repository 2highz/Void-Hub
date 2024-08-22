// Your Firebase config here
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const messageInput = document.getElementById('messageInput');
const sendMessage = document.getElementById('sendMessage');
const messages = document.getElementById('messages');

let localStream;
let peerConnection;

const iceServers = [
    {urls: 'stun:stun.l.google.com:19302'}
];

const constraints = {
    video: true,
    audio: false
};

// Get local media stream
navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localVideo.srcObject = stream;
        localStream = stream;
        setupPeerConnection();
    })
    .catch(error => console.error('Error accessing media devices.', error));

// Set up WebRTC peer connection
function setupPeerConnection() {
    peerConnection = new RTCPeerConnection({ iceServers });

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            // Send ICE candidate to remote peer
            database.ref('iceCandidates').push(event.candidate.toJSON());
        }
    };

    // Handle incoming ICE candidates
    database.ref('iceCandidates').on('child_added', snapshot => {
        const candidate = snapshot.val();
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(error => console.error('Error adding received ice candidate.', error));
    });

    // Handle chat messages
    database.ref('messages').on('child_added', snapshot => {
        const message = snapshot.val();
        messages.innerHTML += `<p>${message.text}</p>`;
        messages.scrollTop = messages.scrollHeight;
    });

    sendMessage.addEventListener('click', () => {
        const messageText = messageInput.value;
        if (messageText) {
            database.ref('messages').push({ text: messageText });
            messageInput.value = '';
        }
    });
}
