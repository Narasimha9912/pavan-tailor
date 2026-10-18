
/*
  IMPORTANT:
  Replace 91XXXXXXXXXX with the shop's real WhatsApp number.
  Use country code + digits only. For India, begin with 91.
*/
const SHOP_WHATSAPP_NUMBER = "91XXXXXXXXXX";

const $ = id => document.getElementById(id);

$("year").textContent = new Date().getFullYear();

// Mobile navigation
$("menu").addEventListener("click", () => {
  $("nav").classList.toggle("open");
});

$("nav").querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    $("nav").classList.remove("open");
  });
});

// Notifications
let toastTimer;

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 4000);
}

// WhatsApp
function openWhatsApp(message) {
  if (
    !/^\d{10,15}$/.test(SHOP_WHATSAPP_NUMBER) ||
    SHOP_WHATSAPP_NUMBER.includes("X")
  ) {
    toast("Please configure the shop's WhatsApp number in script.js.");
    return;
  }

  const url =
    "https://wa.me/" +
    SHOP_WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(message);

  window.open(url, "_blank", "noopener,noreferrer");
}

$("whatsapp").addEventListener("click", event => {
  event.preventDefault();

  openWhatsApp(
    "Hello Pavan Tailor! I would like to ask about your tailoring services in Allagadda."
  );
});

// Booking form
$("booking-form").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("name").value.trim();
  const phone = $("phone").value.trim();
  const service = $("service").value;
  const details = $("details").value.trim();

  if (!name || !phone || !service) {
    toast("Please fill in your name, phone number and service.");
    return;
  }

  const message = [
    "Hello Pavan Tailor! I would like to make a booking enquiry.",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Service: ${service}`,
    details ? `Details: ${details}` : "",
    "Location: Allagadda"
  ].filter(Boolean).join("\n");

  openWhatsApp(message);
});

// Automatically select service when a service link is clicked
document.querySelectorAll("[data-service]").forEach(link => {
  link.addEventListener("click", () => {
    $("service").value = link.dataset.service;
  });
});

// --------------------------------------------------
// MEASUREMENT DASHBOARD
// These records are stored only in this browser.
// This is not a secure, shared backend database.
// --------------------------------------------------

const STORAGE_KEY = "pavanTailorLocalMeasurements_v1";

const measurementFields = [
  ["Chest", "chest"],
  ["Waist", "waist"],
  ["Hip", "hip"],
  ["Shoulder", "shoulder"],
  ["Sleeve", "sleeve"],
  ["Length", "length"]
];

function readRecords() {
  try {
    const records = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    toast("Browser storage unavailable or full.");
    return false;
  }
}

// Escape saved text before showing it in HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Display records
function renderRecords() {
  const records = readRecords();

  $("record-count").textContent = records.length
    ? `${records.length} saved record(s)`
    : "No records saved";

  if (!records.length) {
    $("record-list").innerHTML =
      "<p class='muted'>No records saved in this browser yet.</p>";
    return;
  }

  $("record-list").innerHTML = records.map(record => {
    const measurementsText = Object.entries(record.measurements)
      .map(([name, value]) => `${name}: ${value} in`)
      .join(" · ");

    return `
      <article class="record">
        <b>${escapeHTML(record.name)} — ${escapeHTML(record.garment)}</b>

        <p>
          ${escapeHTML(record.date)}
          ${record.phone ? " · " + escapeHTML(record.phone) : ""}
        </p>

        <p>${escapeHTML(measurementsText || "No measurements entered")}</p>

        ${record.notes
          ? `<p>Notes: ${escapeHTML(record.notes)}</p>`
          : ""
        }

        <button data-remove="${escapeHTML(record.id)}">
          Delete Record
        </button>
      </article>
    `;
  }).join("");

  $("record-list").querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      const remaining = readRecords().filter(
        record => record.id !== button.dataset.remove
      );

      if (saveRecords(remaining)) {
        renderRecords();
        toast("Local record deleted.");
      }
    });
  });
}

// Open and close dashboard
function openDashboard() {
  $("admin-modal").hidden = false;
  document.body.classList.add("modal-open");
  renderRecords();
}

function closeDashboard() {
  $("admin-modal").hidden = true;
  document.body.classList.remove("modal-open");
}

$("open-admin").addEventListener("click", openDashboard);
$("open-admin-footer").addEventListener("click", openDashboard);
$("close-admin").addEventListener("click", closeDashboard);

$("admin-modal").addEventListener("click", event => {
  if (event.target === $("admin-modal")) {
    closeDashboard();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("admin-modal").hidden) {
    closeDashboard();
  }
});

// Dashboard tabs
document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(tab => {
      tab.classList.toggle("active", tab === button);
    });

    $("measure-pane").hidden = button.dataset.tab !== "measure";
    $("saved-pane").hidden = button.dataset.tab !== "saved";

    if (button.dataset.tab === "saved") {
      renderRecords();
    }
  });
});

// Save measurement record
$("measurement-form").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("cname").value.trim();
  const garment = $("garment").value;

  if (!name || !garment) {
    toast("Enter customer name and garment.");
    return;
  }

  const measurements = {};

  measurementFields.forEach(([label, id]) => {
    if ($(id).value !== "") {
      measurements[label] = $(id).value;
    }
  });

  const record = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    name,
    phone: $("cphone").value.trim(),
    garment,
    measurements,
    notes: $("mnotes").value.trim(),
    date: new Date().toLocaleDateString()
  };

  const records = [record, ...readRecords()];

  if (saveRecords(records)) {
    event.target.reset();

    document.querySelector('[data-tab="saved"]').click();

    toast("Saved in this browser on this device.");
  }
});

// Delete all local records
$("clear").addEventListener("click", () => {
  if (
    readRecords().length &&
    confirm("Delete all measurement records stored in this browser?")
  ) {
    if (saveRecords([])) {
      renderRecords();
      toast("All local records deleted.");
    }
  }
});

// Export records to CSV
$("export").addEventListener("click", () => {
  const records = readRecords();

  if (!records.length) {
    toast("No records to export.");
    return;
  }

  const headers = [
    "Customer",
    "Phone",
    "Garment",
    ...measurementFields.map(([name]) => name + " (in)"),
    "Notes",
    "Date"
  ];

  const csvCell = value =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"';

  const rows = [
    headers.map(csvCell).join(","),
    ...records.map(record => {
      return [
        record.name,
        record.phone,
        record.garment,
        ...measurementFields.map(([name]) =>
          record.measurements[name] || ""
        ),
        record.notes,
        record.date
      ].map(csvCell).join(",");
    })
  ];

  const csv = rows.join("\r\n");

  const url = URL.createObjectURL(
    new Blob(["\ufeff", csv], {
      type: "text/csv;charset=utf-8"
    })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "pavan-tailor-measurements.csv";
  link.click();

  URL.revokeObjectURL(url);
});
