/**
 * Maps a district name to a major global region.
 */
const getRegionFromDistrict = (name) => {
    const n = name.toLowerCase();

    // 1. Philippines
    if (
        n.includes("bulacan") || n.includes("cavite") || n.includes("laguna") ||
        n.includes("rizal") || n.includes("pampanga") || n.includes("bataan") ||
        n.includes("zambales") || n.includes("tarlac") || n.includes("pangasinan") ||
        n.includes("ilocos") || n.includes("cagayan") || n.includes("isabela") ||
        n.includes("ncr") || n.includes("metro manila") || n.includes("quezon city") ||
        n.includes("makati") || n.includes("pau") || n.includes("central") ||
        n.includes("maynila") || n.includes("caloocan") || n.includes("camanava") ||
        n.includes("marikina") || n.includes("quezon") || n.includes("aurora") ||
        n.includes("batangas") || n.includes("mindoro") || n.includes("palawan") ||
        n.includes("albay") || n.includes("camarines") || n.includes("sorsogon") ||
        n.includes("catanduanes") || n.includes("masbate") || n.includes("marinduque") ||
        n.includes("romblon") || n.includes("abra") || n.includes("benguet") ||
        n.includes("ifugao") || n.includes("kalinga") || n.includes("mountain province") ||
        n.includes("nueva vizcaya") || n.includes("nueva ecija") || n.includes("quirino") ||
        n.includes("la union")
    ) return "Luzon";

    if (
        n.includes("cebu") || n.includes("iloilo") || n.includes("negros") ||
        n.includes("leyte") || n.includes("samar") || n.includes("bohol") ||
        n.includes("capiz") || n.includes("aklan") || n.includes("antique") ||
        n.includes("guimaras") || n.includes("siquijor") || n.includes("biliran")
    ) return "Visayas";

    if (
        n.includes("davao") || n.includes("zamboanga") || n.includes("misamis") ||
        n.includes("bukidnon") || n.includes("cotabato") || n.includes("agusan") ||
        n.includes("surigao") || n.includes("lanao") || n.includes("maguindanao") ||
        n.includes("sultan kudarat") || n.includes("sarangani") || n.includes("basilan") ||
        n.includes("sulu") || n.includes("tawi-tawi") || n.includes("camiguin") ||
        n.includes("dinagat") || n.includes("gensan") || n.includes("pagadian") ||
        n.includes("buug") || n.includes("koronadal") || n.includes("general santos")
    ) return "Mindanao";

    // 2. Americas
    if (
        n.includes("california") || n.includes("new york") || n.includes("texas") ||
        n.includes("florida") || n.includes("canada") || n.includes("ontario") ||
        n.includes("quebec") || n.includes("toronto") || n.includes("vancouver") ||
        n.includes("usa") || n.includes("america") || n.includes("brazil") ||
        n.includes("jersey") || n.includes("washington") || n.includes("oregon") ||
        n.includes("hawaii") || n.includes("alaska") || n.includes("caribbean") ||
        n.includes("mexico") || n.includes("valley") || n.includes("plains") ||
        n.includes("mountain states") || n.includes("great lakes") || n.includes("dc") ||
        n.includes("ottawa") || n.includes("calgary") || n.includes("edmonton") ||
        n.includes("manitoba") || n.includes("saskatchewan") || n.includes("british columbia")
    ) return "Americas";

    // 3. Europe/Africa
    if (
        n.includes("britain") || n.includes("uk") || n.includes("italy") ||
        n.includes("spain") || n.includes("france") || n.includes("germany") ||
        n.includes("europe") || n.includes("africa") || n.includes("london") ||
        n.includes("rome") || n.includes("madrid") || n.includes("paris") ||
        n.includes("ireland") || n.includes("mediterranean")
    ) return "Europe/Africa";

    // 4. Asia/Pacific (Non-PH)
    if (
        n.includes("japan") || n.includes("korea") || n.includes("china") ||
        n.includes("taiwan") || n.includes("hongkong") || n.includes("macau") ||
        n.includes("australia") || n.includes("new zealand") || n.includes("singapore") ||
        n.includes("malaysia") || n.includes("thailand") || n.includes("vietnam") ||
        n.includes("asia") || n.includes("pacific") || n.includes("micronesia") ||
        n.includes("saipan") || n.includes("guam") || n.includes("nagoya") ||
        n.includes("tokyo") || n.includes("queensland") || n.includes("nsw") ||
        n.includes("victoria") || n.includes("sabah")
    ) return "Asia/Oceania";

    return "International";
};

module.exports = { getRegionFromDistrict };
