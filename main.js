$(document).ready(function () {
  //global variables
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
    aboutSection: '#aboutSection',
    coinSection: '#coinSection',
    reportSection: '#reportSection',
    loader: '.loaderContainer',
  };

  const { main, aboutSection, coinSection, reportSection } = selectors;
  const loader = `<div class="loaderContainer" id="loader"><div class="loader"></div></div>`;

  //create var to identify graph reports updates
  let intervalId = null;

  //create the coin section upon page load
  createCoinSection();

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

      case coinSection:
        createCoinSection();
        //alert('about');
        break;

      case reportSection:
        createReportSection();
        //alert('report');
        break;

      default:
        createAboutSection();
        break;
    }
  });

  //creating the about section
  function createAboutSection() {
    //clears all previous sections
    $(main).empty();
    //check if the report section keeps updating, and clears it if it does
    stopGraphUpdates();
    let aboutSection = $(selectors.aboutSection);
    $(main).append('<div id="aboutSection" ></div>');
    $('#aboutSection').append('<div class="parallax"></div>');
    const content = `<div id = "contentContainer"  >
    <h1> Some details about this project </h1>
    <h2>What does this app do?</h2>

    <p>
      This is a <b>single page application</b> that displays a list of cryptocurrencies retrieved from the
      Coingecko API and allows the user to select which coins they
      want to see price data for.
    </p>

    <p>
    This is a JavaScript app interacts with two cryptocurrency
    API endpoints: https://api.coingecko.com/api/v3/coins/ and
    https://min-api.cryptocompare.com/data/pricemulti.
    </p>
 
     <p>
      The app uses <b> jQuery </b> to manipulate the DOM and handle user
      events. It sets up event listeners to detect when the user
      clicks on buttons and links, and it uses <b> AJAX </b> to make
      asynchronous requests to the APIs.
    </p>

     <p>
      The app also uses local storage to cache data about coins that
      the user has viewed in more detail, so that it doesn't have to
      make another API request for that coin's information for at
      least two minutes.
    </p>

    <p>
      The app also has a report section that displays a graph of the
      selected coins' prices over time, using data retrieved from the
      Cryptocompare API.
    </p>

    <p>
      The app uses the CanvasJS library to render the graph. Overall,
      this app provides a simple interface for users to view and
      compare cryptocurrency prices over time, and it demonstrates how
      to interact with multiple APIs and handle asynchronous data
      fetching in a web app.
    </p>
    
    <h2>Why this design?</h2>
    <p>
      While researching cryptocurrency websites, I noticed that they were primarily designed for men. Most of them had a dramatic design that could be a little intimidating. I wanted to create a site that would feel welcoming to both men and women.
    </p>
    <p>
      During my research, I discovered that certain elements can make a website more female-friendly, such as:
    <ul>
      <li>Using colors with less contrast </li>
      <li>Choosing hues that are less bright</li>
      <li>Ensuring that lots of information is available at any point </li>
    </ul>
    </p>
    
    <div class = "aboutMe">
    <h2> Who am i? </h2>
      <h4> Michal Motai </h4>
      <p> <span>Tel: 0546387272 </span><br>
      
      <a href="mailto:michal.motei@gmail.com">michal.motei@gmail.com</a></p>
      <img src="src/avatar.png" alt="my avatar" class = "avatr">
      </div>
  </div>`;

    //create about section
    $('#aboutSection').append(content);
  }

  //create coin section
  function createCoinSection() {
    //check if the report section keeps updating, and clears it if it does
    stopGraphUpdates();

    //clears all sections
    $(main).empty();
    let coinSection = $(selectors.coinSection);

    selectedCoins = [];

    //check if coinSection exists, if it doesn't create coinSection
    if (!coinSection.length) {
      coinSection = $('<section>', {
        id: 'coinSection',
        class: 'section',
      });
    }

    //add coinSection to page
    coinSection.appendTo(main);

    //get coins data from api and display them in cards
    handleCoins();

    //keeps track of selected coins for report
    selectCoinsForReport();

    //add event listner to the more info buttons
    $(coinSection).on('click', '.infoBtn', dispalyMoreInfo);
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

  //get coins data and display on page
  async function displayCoins(coins) {
    $(coinSection).append(`<div id ="coinsDiv"></div>`);
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
        <div class="loaderContainer"></div>
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

      //setTimeout is not requiered, it is only meant for showing the loader for longer time
      setTimeout(() => {
        $('.loaderContainer').hide();
        displayCoins(coins);
      }, 200);
    } catch (error) {
      console.log();
    }
  }

  //displays the more info on each coin selected
  async function dispalyMoreInfo() {
    let coin;
    const coinId = $(this).attr('data-coin-id');
    const currentCard = $(`#card${coinId}`);
    //console.log('currentCard: ', currentCard);
    const currentLoaderContainer = $(currentCard).find('.loaderContainer');
    const moreInfoDiv = $(currentCard).find('.moreInfoDiv');

    const now = new Date();
    const timer = moreInfoTimers[coinId];

    const timeDiff = timer ? now - timer : TWO_MINUTES;

    if (timeDiff < TWO_MINUTES) {
      // get the coin from local storage

      const coinsHash = getCoinFromLocalStorage();
      console.log('coin from local storage');

      coin = coinsHash[coinId];
    } else {
      // if 2 minutes have passed - get the coin from the api

      // render loader
      $(loader).appendTo(currentLoaderContainer);
      $(currentLoaderContainer).show();
      console.log('coins from api');

      coin = await getSpecificCoinData(coinId);

      //remove loader
      $(loader).remove();
      $(currentLoaderContainer).hide();

      // get the current data from local storage
      const coinsHash = getCoinFromLocalStorage();

      coinsHash[coinId] = coin;

      //insert the coin data into local storage
      localStorage.setItem(
        MORE_INFO_LOCAL_STORAGE_KEY,
        JSON.stringify(coinsHash)
      );
      //reset the timer
      moreInfoTimers[coinId] = new Date();
    }

    const content = `
    <div class="moreInfoDiv" id = "moreInfoDiv_${coinId}">
        <p> $ &nbsp ${coin.market_data.current_price.usd} <br>
        <p> € &nbsp ${coin.market_data.current_price.eur} <br>
        <p> ₪ &nbsp ${coin.market_data.current_price.ils}
        </div>`;

    //check if there is a more info div
    if (moreInfoDiv.length > 0) {
      // if moreInfoDiv already exists, remove it
      moreInfoDiv.remove();
    } else {
      currentCard.append(content);
    }
  }

  //get a specific coin info from api with coin id
  async function getSpecificCoinData(id) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}`
      );
      const coin_moreInfo = await response.json();
      // console.log(coin_moreInfo);

      return coin_moreInfo;
    } catch (error) {
      console.error(error);
    }
  }

  //retrieve coin from loacl storage
  function getCoinFromLocalStorage() {
    const coin = localStorage.getItem(MORE_INFO_LOCAL_STORAGE_KEY);
    return coin ? JSON.parse(coin) : {};
  }

  //keep track of the selected coin checkboxes
  function selectCoinsForReport() {
    updateToggleButtons(selectedCoins);
    $('#coinSection').on('click', '.checkbox', function () {
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
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-warning">
                <h4 class="modal-title" id="staticBackdropLabel">Only 5 coins can be selected for report!</h4>
                <button type="button" class="btn-close close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <h4>Would like to add <strong> ${lastSelectCoin} </strong> to the list?</h4>
               
               choose antoher coin to remove <br><br>
                ${content}
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary close" data-bs-dismiss="modal" >cancel</button>
                <button type="button" class="btn btn-warning" id = "updateCoins">update coins</button>
              </div>
            </div>
          </div>
        </div>`;

          // Add the modal to the page
          $('#coinSection').append(modal);

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

              updateToggleButtons(selectedCoins);
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

    //remove coins from selection
    function removeFromSelectedCoins(coin) {
      let index = selectedCoins.indexOf(coin);
      if (index > -1) {
        selectedCoins.splice(index, 1);
      }
    }

    //update the toggle buttons according the the selected coins
    function updateToggleButtons(selectedCoins) {
      $('#coinSection .checkbox').each(function () {
        const coin = $(this).val();
        const isChecked = selectedCoins.includes(coin);
        $(this).prop('checked', isChecked);
      });
    }
    return selectedCoins;
  }

  //get data from api for graph
  async function getDataForGraphs(selectedCoins) {
    try {
      console.log(selectedCoins);
      const response = await fetch(
        `${graphsDataUrl}?fsyms=${selectedCoins}&tsyms=USD`
      );
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  //create report section
  async function createReportSection() {
    $(main).empty();
    $(main).append('<div id="reportSection">' + loader + '</div>');

    //Check if there are any coins selected. only if there are any coins go to report section
    if (selectedCoins.length === 0) {
      alert('Please select 1-5 coins for report');
      createCoinSection();
    } else {
      const data = await getDataForGraphs(selectedCoins);

      drawGraph(data);

      function drawGraph(data) {
        var options = {
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
    }

    function toggleDataSeries(e) {
      if (typeof e.dataSeries.visible === 'undefined' || e.dataSeries.visible) {
        e.dataSeries.visible = false;
      } else {
        e.dataSeries.visible = true;
      }
      e.chart.render();
    }
  }

  //stop the graph from updating
  function stopGraphUpdates() {
    if (intervalId) {
      clearInterval(intervalId);
    }
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
});
