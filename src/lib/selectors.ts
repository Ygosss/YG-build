// src/lib/selectors.ts

/**
 * ศูนย์รวม DOM Selectors ทั้งหมดของแอปพลิเคชัน
 * [Original: m]
 */
export const m = {
    // App & Layout
    orderForm: "#orderForm",
    roomsContainer: "#rooms",
    toastContainer: "#toast-container",
    printableContent: "#printable-content",
    filterStatusBar: "#filterStatusBar",

    // Header & Menu
    menuBtn: "#menuBtn",
    menuDropdown: "#menuDropdown",
    undoBtn: "#undoBtn",
    themeToggleBtn: "#themeToggleBtn",
    overviewBtn: "#overviewBtn",
    copyTextBtn: "#copyTextBtn",
    visualReportsBtn: "#visualReportsBtn",
    exportPdfBtn: "#exportPdfBtn",
    submitBtn: "#submitBtn",
    lockBtn: "#lockBtn",
    
    // Data (Menu)
    importBtn: "#importBtn",
    exportBtn: "#exportBtn",
    importFavsBtn: "#importFavsBtn",
    exportFavsBtn: "#exportFavsBtn",
    clearItemsBtn: "#clearItemsBtn",
    clearAllBtn: "#clearAllBtn",
    
    // Toolbar (QuickNav, Toggles)
    quickNavBtn: "#quickNavBtn",
    quickNavDropdown: "#quickNavDropdown",
    quickNavRoomList: "#quickNavRoomList",
    quickNavBtnText: "#quickNavBtnText",
    toggleAllRoomsBtn: "#toggleAllRoomsBtn",
    suspendedItemsBtn: "#suspendedItemsBtn",
    suspendedCountBadge: "#suspendedCountBadge",
    
    // Summary Footer
    originalTotal: "#originalTotal",
    grandTotal: "#grandTotal",

    // Customer Card
    customerCard: "#customerCard",
    customerNameInput: 'input[name="customer_name"]',
    customerPhoneInput: 'input[name="customer_phone"]',
    customerAddressInput: 'textarea[name="customer_address"]',

    // Room Card
    roomTpl: "#roomTpl",
    room: ".room-card",
    roomNameInput: 'input[name="room_name"]',
    roomNameDisplay: "[data-room-name-display]",
    allItemsContainer: ".all-items-container",
    roomBrief: "[data-room-brief]",

    // Item (Common)
    itemTitle: "[data-item-title]",

    // Item Templates (Tpl)
    setTpl: "#setTpl",
    wallpaperTpl: "#wallpaperTpl",
    areaBasedTpl: "#areaBasedTpl",
    itemPlaceholderTpl: "#itemPlaceholderTpl",

    // Set Item (ผ้าม่าน)
    setWidthInput: 'input[name="width_m"]',
    setHeightInput: 'input[name="height_m"]',
    setStyleSelect: 'select[name="style"]',
    setFabricVariantSelect: 'select[name="fabric_variant"]',
    setPricePerMSelect: 'select[name="price_per_m_raw"]',
    setSheerPricePerMSelect: 'select[name="sheer_price_per_m"]',
    setLouisPricePerMSelect: 'select[name="louis_price_per_m"]',
    setFabricCodeInput: 'input[name="fabric_code"]',
    setSheerFabricCodeInput: 'input[name="sheer_fabric_code"]',
    setOpeningStyleSelect: 'select[name="opening_style"]',
    setAdjustmentSideSelect: 'select[name="adjustment_side"]',
    setNotesInput: 'textarea[name="notes"]',
    setSheerGroup: "#sheerGroup",
    setLouisGroup: "#louisGroup",
    
    // Wallpaper Item
    wallHeightInput: 'input[name="height_m"]',
    wallCodeInput: 'input[name="code"]',
    wallPriceRollInput: 'input[name="price_per_roll"]',
    wallInstallCostInput: 'input[name="install_cost_per_roll"]',
    wallNotesInput: 'textarea[name="notes"]',

    // AreaBased Item
    areaWidthInput: 'input[name="width_m"]',
    areaHeightInput: 'input[name="height_m"]',
    areaPriceSqydInput: 'input[name="price_sqyd"]',
    areaCodeInput: 'input[name="code"]',
    areaNotesInput: 'textarea[name="notes"]',
    
    // Modals (Common)
    modal: ".modal",
    modalCloseBtn: ".modal-close",

    // PDF Options Modal
    pdfOptionsModal: "#pdfOptionsModal",
    
    // Dimension Entry Modal
    dimensionEntryModal: "#dimensionEntryModal",
    
    // Item Type Modal
    itemTypeModal: "#itemTypeModal",
    itemTypeModalTitle: "#itemTypeModalTitle",

    // Discount Modal
    discountModal: "#discountModal",
    discountSubtotal: "#discountSubtotal",
    discountFinalTotal: "#discountFinalTotal",
    discountTypeInput: 'select[name="discount_type"]',
    discountValueInput: 'input[name="discount_value"]',
    discountPercent: 'input[name="discount_percent_display"]',
    discountAmount: 'input[name="discount_amount_display"]',

    // Visual Overview Modal
    overviewModal: "#overviewModal",
    overviewModalHeader: "#overviewModalHeader",
    overviewModalBody: "#overviewModalBody",

    // Data Importer
    fileImporter: "#fileImporter",
    favImporter: "#favImporter",
    favoritesConflictModal: "#favoritesConflictModal",

    // Hardware Modal
    hardwareModal: "#hardwareModal",
    modalTrackColor: '[name="modal_track_color"]',
    modalBracketColor: '[name="modal_bracket_color"]',
    modalFinialColor: '[name="modal_finial_color"]',
    modalGrommetColor: '[name="modal_grommet_color"]',
    modalLouisValance: '[name="modal_louis_valance"]',
    modalLouisTassels: '[name="modal_louis_tassels"]',
    grommetColorGroup: "#grommetColorGroup",

    // Favorites Selector Modal
    favoritesModal: "#favoritesModal",
    favoritesModalTitle: "#favoritesModalTitle",
    favoritesModalBody: "#favoritesModalBody",
    favSearchInput: "#favSearchInput",
    favSelectorItemTpl: "#favSelectorItemTpl",
    favInput: "input[data-favorite-type]", // Selector for inputs that trigger the modal

    // Favorites Manager Modal
    favManagerModal: "#favManagerModal",
    favManagerTitle: "#favManagerTitle",
    favManagerBody: "#favManagerBody",
    favManagerItemTpl: "#favManagerItemTpl",
    favManagerEditBtn: '#favManagerModal [data-act="edit-selected-fav"]',
    favManagerDelBtn: '#favManagerModal [data-act="del-selected-fav"]',
    
    // Add/Edit Fav Modals
    favAddModal: "#favAddModal",
    favAddCodeInput: '[name="fav_code_add"]',
    favAddPriceInput: '[name="fav_price_add"]',
    favEditModal: "#favEditModal",
    favEditCodeInput: '[name="fav_code_edit"]',
    favEditPriceInput: '[name="fav_price_edit"]',
    
    // Room Defaults Modal
    roomDefaultsModal: "#roomDefaultsModal",
    roomDefaultsForm: "#roomDefaultsForm",
};