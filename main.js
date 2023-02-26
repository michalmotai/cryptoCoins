$(document).ready(function () {
  const coinsUrl = 'https://api.coingecko.com/api/v3/coins/';
  const graphsDataUrl = 'https://min-api.cryptocompare.com/data/pricemulti';
  let coins = [];
  let coins_moreInfo = [];
  const MORE_INFO_LOCAL_STORAGE_KEY = 'moreInfo';
  const TWO_MINUTES = 120000; // 2 minutes
  const moreInfoTimers = {};
  let selectedCoins = [];

  localStorage.setItem(MORE_INFO_LOCAL_STORAGE_KEY, JSON.stringify({}));

  const selectors = {
    main: '#main',
    homeSection: '#homeSection',
    aboutSection: '#aboutSection',
    reportSection: '#reportSection',
    loader: '#loader',
  };

  const { main, homeSection, aboutSection, reportSection } = selectors;
  const loader = `<div class="loaderContainer" id="loader"><div class="loader"></div></div>`;
  let intervalId = null;

  $(reportSection).remove();
  $(aboutSection).remove();

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
        createReportSection();
        //alert('report');
        break;

      default:
        homeSection;
        createHomeSection();
        break;
    }
  });

  function createHomeSection() {
    $(main).empty();
    let homeSection = $(selectors.homeSection);

    //check if homeSection exists
    if (!homeSection.length) {
      homeSection = $('<section>', {
        id: 'homeSection',
        class: 'some-class',
      });
    }

    //check if the report section keeps updating, and clears it if it does
    if (intervalId) {
      clearInterval(intervalId);
    }

    //add homeSection to page
    homeSection.appendTo(main);

    //get coins data from api and display them in cards
    handleCoins();

    //keeps track of selected coins for report
    selectCoinsForReport();

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

  async function createReportSection() {
    $(main).empty();
    $(main).append('<div id="reportSection">' + loader + '</div>');

    const data = await getDataForGraphs(selectedCoins);
    drawGraph(data);

    function drawGraph(data) {
      var options = {
        // ...
        data: [],
      };

      const coinDataPoints = {};

      intervalId = setInterval(() => {
        for (const symbol in data) {
          const price = data[symbol].USD;
          const date = new Date();

          // Create or get the array of data points for this coin symbol
          if (!(symbol in coinDataPoints)) {
            coinDataPoints[symbol] = [];
          }
          const coinDataPoint = {
            x: date,
            y: price,
          };
          coinDataPoints[symbol].push(coinDataPoint);

          // Create the data series object for this coin symbol
          const symbolData = {
            type: 'spline',
            showInLegend: true,
            name: symbol,
            dataPoints: coinDataPoints[symbol],
          };

          // Find the index of the data series object for this coin symbol in the options.data array
          let symbolIndex = -1;
          for (let i = 0; i < options.data.length; i++) {
            if (options.data[i].name === symbol) {
              symbolIndex = i;
              break;
            }
          }

          // Add or update the data series object for this coin symbol in the options.data array
          if (symbolIndex >= 0) {
            options.data[symbolIndex] = symbolData;
          } else {
            options.data.push(symbolData);
          }
        }
        console.log(options.data);
        const chart = new CanvasJS.Chart('reportSection', options);
        chart.render();
        $(selectors.loader).remove();
      }, 2000);
    }

    //$('#reportSection').CanvasJSChart(options);

    function toggleDataSeries(e) {
      if (typeof e.dataSeries.visible === 'undefined' || e.dataSeries.visible) {
        e.dataSeries.visible = false;
      } else {
        e.dataSeries.visible = true;
      }
      e.chart.render();
    }
  }

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

  function createAboutSection() {
    $(main).empty();
    $(main).append('<div id="aboutSection" ></div>');
    $(aboutSection).append('<div class="parallax"></div>');
    const content = `<div id = "contentContainer"  >
    <p>
    This is a JavaScript app that interacts with two cryptocurrency
    API endpoints: https://api.coingecko.com/api/v3/coins/ and
    https://min-api.cryptocompare.com/data/pricemulti.
  </p>
 
    <p>
      The app displays a list of cryptocurrencies retrieved from the
      Coingecko API and allows the user to select which coins they
      want to see price data for.
    </p>

    <p>
      The app also has a report section that displays a graph of the
      selected coins' prices over time, using data retrieved from the
      Cryptocompare API.
    </p>

    <p>
      The app uses jQuery to manipulate the DOM and handle user
      events. It sets up event listeners to detect when the user
      clicks on buttons and links, and it uses AJAX to make
      asynchronous requests to the APIs.
    </p>

    <p>
      The app also uses local storage to cache data about coins that
      the user has viewed in more detail, so that it doesn't have to
      make another API request for that coin's information for at
      least two minutes.
    </p>

    <p>
      The app has a number of helper functions that handle specific
      tasks, such as creating and displaying the home, about, and
      report sections of the app, selecting coins for the report, and
      drawing the graph in the report section.
    </p>

    <p>
      The app uses the CanvasJS library to render the graph. Overall,
      this app provides a simple interface for users to view and
      compare cryptocurrency prices over time, and it demonstrates how
      to interact with multiple APIs and handle asynchronous data
      fetching in a web app.
    </p>
  </div>`;

    $(aboutSection).append(content);
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
      $('.loaderContainer').show();
      coins = await getCoinsData();

      setTimeout(() => {
        $('.loaderContainer').hide();
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

  //gets more info about each coin
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

    //show more info when button "moreInfo" is pressed.
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

  function selectCoinsForReport() {
    $('#homeSection').on('click', '.checkbox', function () {
      let coin = $(this).val();

      if ($(this).prop('checked')) {
        // Check if the number of selected coins is less than 5
        if (selectedCoins.length < 5) {
          if (!selectedCoins.includes(coin)) {
            selectedCoins.push(coin);
          }

          console.log(selectedCoins);
          return selectedCoins;
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

          // Add the modal to the page
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

      return selectedCoins;
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
    return selectedCoins;
  }

  async function getDataForGraphs(selectedCoins) {
    try {
      console.log(selectedCoins);
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${selectedCoins}&tsyms=USD`
      );
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  function getCoinFromLocalStorage() {
    const coin = localStorage.getItem(MORE_INFO_LOCAL_STORAGE_KEY);
    return coin ? JSON.parse(coin) : {};
  }

  //search input for coins
  $('#searchInput').on('keyup input', function () {
    const textToSearch = $(this).val().toLowerCase();
    console.log(textToSearch);
    if (!textToSearch) {
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

  console.log('end');
});
