$(document).ready(function () {
  const coinsUrl = 'https://api.coingecko.com/api/v3/coins/';
  let coins = [];
  let coins_moreInfo = [];
  const MORE_INFO_LOCAL_STORAGE_KEY = 'moreInfo';
  const TWO_MINUTES = 120000; // 2 minutes
  const moreInfoTimers = {};
  const selectedCoins = [];
  localStorage.setItem(MORE_INFO_LOCAL_STORAGE_KEY, JSON.stringify({}));

  const selectors = {
    main: '#main',
    homeSection: '#homeSection',
    aboutSection: '#aboutSection',
    reportSection: '#reportSection',
    loader: '#loader',
    //modal: '#modal',
  };

  const { main, homeSection, aboutSection, reportSection } = selectors;

  const loader = `<div class="loaderContainer" id="loader"><div class="loader"></div></div>`;

  //recognise the nav button pressed
  $('.links').on('click', function () {
    const dataSection = $(this).attr('data-linksTo');

    $('.section').remove(); //removes all the sections

    //create a new section

    $('<section>', {
      id: dataSection,
      class: 'section',
    }).appendTo(main);

    const section = `#${dataSection}`;
    console.log(dataSection);

    switch (section) {
      case aboutSection:
        createAboutSection();
        //alert('about');
        break;

      case reportSection:
        //alert('report');
        break;

      default:
        homeSection;
        createHomeSection();
        break;
    }
  });

  function createHomeSection() {
    handleCoins();
    selectCoinsForReport(coins);

    function selectCoinsForReport() {
      const selectedCoins = [];

      $('#homeSection').on('click', '.checkbox', function () {
        let coin = $(this).val();

        if ($(this).prop('checked')) {
          // Check if the number of selected coins is less than 5
          if (selectedCoins.length < 5) {
            selectedCoins.push(coin);
            console.log(selectedCoins);
          } else {
            const lastSelectCoin = coin;
            $(this).prop('checked', false);
            //alert(`you can only choose 5 coins:`);
            console.log(coin);

            let content = '';
            for (coin of selectedCoins) {
              let text = `
              <div class="selectedItemsDiv"> 
              <label class="switch">
                  <input type="checkbox" class="checkbox" value="${coin}" checked>
                  <span class="slider round"></span>
                </label>
                ${coin} </div>`;

              content += text;
            }

            // If the user has already selected 5 coins

            const modal = document.createElement('div');
            modal.classList.add('modal');
            modal.innerHTML = `<div  id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h4 class="modal-title" id="staticBackdropLabel">Only 5 coins can be selected for live reports!</h4>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <h4>Would like to add <strong> ${lastSelectCoin} </strong> to the list?</h4>
                 
                 choose antoher coin to remove <br><br>
                  ${content}
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary close" data-bs-dismiss="modal" >cancel</button>
                  <button type="button" class="btn btn-primary" id = "updateCoins">update coins</button>
                </div>
              </div>
            </div>
          </div>`;

            // Add the  to the page
            $('#homeSection').append(modal);

            // Get the modal buttons
            const closeButton = modal.querySelector('.close');
            const updateButton = modal.querySelector('#updateCoins');

            // Add an event listener to the close button to hide the modal when clicked
            closeButton.addEventListener('click', function () {
              modal.style.display = 'none';
            });
            // Add an event listener to the update button to update selected coins
            updateButton.addEventListener('click', function () {
              if (selectedCoins.length === 5) {
                alert('please remove a coin');
              } else {
                selectedCoins.push(lastSelectCoin);
                console.log('after push', selectedCoins);

                // removeFromSelectedCoins(coin);
                // console.log('after removal', selectedCoins);

                updateToggleButtons();
                console.log('update', selectedCoins);

                //console.log(`${lastSelectCoin}`);

                modal.style.display = 'none';
              }
            });

            // Show the modal
            modal.style.display = 'block';
          }
        } else {
          removeFromSelectedCoins(coin);
          console.log('removed from selection', selectedCoins);
        }

        //console.log(selectedCoins);
      });

      function removeFromSelectedCoins(coin) {
        let index = selectedCoins.indexOf(coin);
        if (index > -1) {
          selectedCoins.splice(index, 1);
        }
      }

      function updateToggleButtons() {
        $('#homeSection .checkbox').each(function () {
          const coin = $(this).val();
          const isChecked = selectedCoins.includes(coin);
          $(this).prop('checked', isChecked);
        });
      }
    }

    $(homeSection).on('click', '.infoBtn', function () {
      const coinId = $(this).attr('data-coin-id');
      let coin;
      const now = new Date();
      const timer = moreInfoTimers[coinId];
      const timeDiff = timer ? now - timer : TWO_MINUTES;

      if (timeDiff < TWO_MINUTES) {
        //get the coin from local storage

        const _coin = getCoinFromLocalStorage();

        coin = _coin[coinId];
      } else {
        //get coin from API server
        coin = displayCoinMoreInfo(coinId);
      }
      const _coin = getCoinFromLocalStorage();
      _coin[coinId] = coin;

      localStorage.setItem(MORE_INFO_LOCAL_STORAGE_KEY, JSON.stringify(_coin));

      //reset timer
      moreInfoTimers[coinId] = new Date();
    });
  }

  function createAboutSection() {
    $(aboutSection).append(`<div class = "parallax"></div>`);
    $(aboutSection).append(`<h1>Michal Motai</h1>`);
    $(aboutSection)
      .append(`<div>This is my CryptoCoins project </div>`)
      .css('height: 1000px');
  }

  function createReportSection() {}

  $(homeSection).append(`
    <div id="loader" class="loader"></div>
  `);

  //get coins date from api.coingecko.com
  async function getCoinsData() {
    try {
      const response = await fetch(coinsUrl);
      const coins = await response.json();
      return coins;
    } catch (error) {
      console.log(error);
    }
  }

  //get coins data and display on page
  async function displayCoins(coins) {
    $(homeSection).append(`<div id ="coinsDiv"></div>`);
    let coinsDiv = document.getElementById('coinsDiv');
    //coins = await getCoinsData();
    let content = '';
    for (const coin of coins) {
      const card = createCard(coin);
      content += card;
    }
    coinsDiv.innerHTML = content;
  }

  //create card for each coin
  function createCard(coin) {
    const {
      id,
      name,
      symbol,
      image: { small },
    } = coin;

    const card = `
      <div class = "card" id = card${id}>
        <img src="${small}" alt="${name}img" class = "coin-symbol">
        <div class = "symbol">${symbol} </div>
        <div class = "coin-name">${name} </div>
        <label class="switch">
          <input type = "checkbox" class = "checkbox" value = "${symbol}">
          <span class="slider round"></span>
        </label>
        <button class = "infoBtn" data-coin-id="${id}" > more info </button>
      </div>
    `;

    return card;
  }

  async function handleCoins() {
    try {
      $('#main').append(loader);
      //$('#loader').show();
      coins = await getCoinsData();

      setTimeout(() => {
        $('#loader').hide();
        displayCoins(coins);
      }, 100);
    } catch (error) {
      console.log();
    }
  }

  //get more info about each coin
  async function getSpecificCoinData(coinId) {
    try {
      const id = coinId; //change to this id
      //console.log(`${coinsUrl}/${id}`);
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}`
      );
      const coin_moreInfo = await response.json();
      //console.log(coin_moreInfo);
      return coin_moreInfo;
    } catch (error) {
      console.error(error);
    }
  }
  //display more info about each coin

  async function displayCoinMoreInfo(coinId) {
    const coin_moreInfo = await getSpecificCoinData(coinId);
    //console.log(coin_moreInfo);

    //change to id
    coin_moreInfo[`${coinId}`] = {
      id: coinId,
      timeStmap: new Date().getTime(),
      name: coin_moreInfo.name,
      symbol: coin_moreInfo.symbol,
      img: coin_moreInfo.image.small,
      usd: coin_moreInfo.market_data.current_price.usd,
      eur: coin_moreInfo.market_data.current_price.eur,
      ils: coin_moreInfo.market_data.current_price.ils,
      card: `card${coinId}`,
      moreInfoDiv: `moreInfoDiv_${coinId}`,
    };

    const { timeStmap, name, symbol, img, usd, eur, ils, card, moreInfoDiv } =
      coin_moreInfo[`${coinId}`];

    if (!coins_moreInfo.includes(coin_moreInfo[`${coinId}`])) {
      coins_moreInfo.push(coin_moreInfo[`${coinId}`]);
    } else {
      console.log('items is already in storage');
    }

    //console.log(coin_moreInfo['bitcoin']);

    localStorage.setItem(
      MORE_INFO_LOCAL_STORAGE_KEY,
      JSON.stringify(coins_moreInfo)
    );

    console.log(timeStmap, name, symbol, img, usd, eur, ils, card, moreInfoDiv);

    const info = `
    <div id = moreInfoDiv_${coinId} class = "moreInfoDiv">
    <p> $ &nbsp ${usd}</p>
    <p> € &nbsp ${eur}</p> 
    <p> ₪ &nbsp ${ils}</p>
     </div>`;

    //show more info it button "moreInfo" is pressed.
    //remove the data if it is pressed again
    if ($(`#moreInfoDiv_${coinId}`).length > 0) {
      $(`#moreInfoDiv_${coinId}`).remove();
    } else {
      $(`#${card}`).append(loader);
      setTimeout(() => {
        $(`#${card}`).append(info);
        $('.loader').removeClass();
      }, 100);
    }
  }

  function getCoinFromLocalStorage() {
    const coin = localStorage.getItem(MORE_INFO_LOCAL_STORAGE_KEY);
    return coin ? JSON.parse(coin) : {};
  }

  //search input for coins
  $('#searchInput').on('keyup', function () {
    const textToSearch = $(this).val().toLowerCase();
    console.log(textToSearch);
    if (textToSearch === '') {
      displayCoins(coins);
    } else {
      const filteredCoins = coins.filter(
        (c) => c.symbol.indexOf(textToSearch) >= 0
      );
      console.log(filteredCoins);
      if (filteredCoins.length > 0) {
        console.log(filteredCoins);
        displayCoins(filteredCoins);
      }
    }
  });
});
