// --- 1. SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
    });
}

// --- 2. INITIALIZATION ---
const appointmentForm = document.getElementById('appointment-form');
const fileInput = document.getElementById('tattoo-upload');
const fileStatus = document.getElementById('file-status');
let uploadedFileName = "No file uploaded";

// Prevent past dates
const datePicker = document.getElementById('date');
if (datePicker) {
    datePicker.min = new Date().toISOString().split("T")[0];
}

// Handle File Name Preview
fileInput?.addEventListener('change', function () {
    if (this.files && this.files[0]) {
        uploadedFileName = this.files[0].name;
        fileStatus.innerText = `Selected: ${uploadedFileName}`;
    }
});

// --- 3. BOOKING LOGIC ---
appointmentForm?.addEventListener('submit', function (e) {
    e.preventDefault();

    const selectedDate = document.getElementById('date').value;
    const selectedTime = document.getElementById('time').value;
    const userPhone = document.getElementById('phone').value;
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const imageBase64 = event.target.result;

        const apptData = {
            user_name: document.getElementById('name').value,
            user_phone: userPhone,
            booking_date: selectedDate,
            booking_time: selectedTime,
            description: document.getElementById('tattoo-description').value,
            image: imageBase64,
        };

        // Conflict Check
        const localAppts = JSON.parse(localStorage.getItem('appointments')) || [];
        const isConflict = localAppts.some(appt =>
            appt.booking_date === selectedDate && appt.booking_time === selectedTime
        );

        if (isConflict) {
            alert(`❌ Slot Taken: ${selectedTime} on ${selectedDate} is already booked.`);
            return;
        }

        // Send via EmailJS
        emailjs.send("service_m7ii4ac", "template_me1ljwe", apptData)
            .then(() => {
                alert("✅ Success! Booking request sent.");
                localAppts.push({ ...apptData, id: Date.now() });
                localStorage.setItem('appointments', JSON.stringify(localAppts));
                appointmentForm.reset();
                fileStatus.innerText = "No file uploaded";
            })
            .catch((err) => {
                alert("❌ Failed to send request. Check connection.");
            });
    };
    reader.readAsDataURL(file);
});

// --- 4. MANAGE BOOKINGS ---
function loadAppointments() {
    const userPhone = document.getElementById('manage-phone')?.value.trim();
    const list = document.getElementById('appointments');
    const appts = JSON.parse(localStorage.getItem('appointments')) || [];

    if (!userPhone) {
        alert("Enter your phone number.");
        return;
    }

    const filtered = appts.filter(a => a.user_phone === userPhone);
    list.innerHTML = filtered.length === 0
        ? '<li>No bookings found.</li>'
        : filtered.map(a => `
      <li class="appointment-card">
        <div>
          <strong>${a.booking_date}</strong> at <strong>${a.booking_time}</strong><br>
          <small>Ref: ${a.reference_image || "Image uploaded"}</small>
        </div>
        <button class="delete-btn" onclick="deleteBooking(${a.id})">Cancel</button>
      </li>`).join('');
}

window.deleteBooking = function (id) {
    let appts = JSON.parse(localStorage.getItem('appointments')) || [];
    appts = appts.filter(a => a.id !== id);
    localStorage.setItem('appointments', JSON.stringify(appts));
    loadAppointments();
};
// Load appointments on manage button click
document.getElementById('manage-btn')?.addEventListener('click', loadAppointments);
