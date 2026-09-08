/**
 * NTX FGBCF — site assistant (client-side FAQ chatbot)
 * No AI API / backend: matches visitor questions against a curated
 * knowledge base by keyword overlap and replies with the best match.
 */
(function () {
  'use strict';

  const KB = [
    {
      keywords: ['find', 'church', 'near', 'directory', 'location', 'churches', 'member churches', 'list'],
      answer: 'You can browse every member church of the North Texas State — searchable by name, pastor, or city — on our <a href="churches.html">Church Directory</a>. It’s organized by the Dallas County and Tarrant County Districts.'
    },
    {
      keywords: ['give', 'giving', 'donate', 'donation', 'tithe', 'offering', 'zelle', 'givelify', 'pay', 'money'],
      answer: 'You can give via <strong>Zelle</strong> (northtexasfullgospel@gmail.com) or <strong>Givelify</strong> — both are on our <a href="giving.html">Giving page</a>. An online giving portal is coming soon.'
    },
    {
      keywords: ['bishop', 'drake', 'state bishop', 'who leads', 'who is in charge', 'leader'],
      answer: 'Bishop Gregory L. Drake I is the State Bishop of the North Texas State. He is also Senior Pastor of The Jubilee Church in DeSoto, TX. Read more on our <a href="leadership.html">Leadership page</a>.'
    },
    {
      keywords: ['administrator', 'cherri', 'rowe', 'office manager', 'admin'],
      answer: 'Minister Cherri Rowe serves as State Administrator, coordinating operations, communications, and administrative affairs for the North Texas State.'
    },
    {
      keywords: ['overseer', 'dallas overseer', 'dallas district', 'billy adkinson'],
      answer: 'The Dallas County District Overseer seat is currently <strong>vacant</strong>. The Tarrant County District Overseer is Elvis L. Bowman, Senior Pastor of Greater Mt. Tabor Christian Center. See <a href="leadership.html">Leadership</a> for the full list.'
    },
    {
      keywords: ['tarrant', 'bowman', 'elvis'],
      answer: 'Elvis L. Bowman is the Tarrant County District Overseer and Senior Pastor of Greater Mt. Tabor Christian Center in Fort Worth.'
    },
    {
      keywords: ['district', 'districts', 'how many district', 'counties'],
      answer: 'The North Texas State is organized into two districts: the <strong>Dallas County District</strong> and the <strong>Tarrant County District</strong>, each led by a District Overseer. See <a href="about.html">About</a> for details.'
    },
    {
      keywords: ['join', 'membership', 'become a member', 'affiliate', 'affiliation', 'covenant partner', 'dues', 'cost to join'],
      answer: 'Joining the Fellowship means being part of the Body of Christ and participating in Covenant Partner giving — typically $120/month per church ($50/month for Senior Pastor Only), or $120/year per pastor individually. Your church keeps its own name, and you don’t have to leave your current affiliation. Full details are on our <a href="faq.html">FAQ page</a>.'
    },
    {
      keywords: ['women', 'female pastor', 'woman pastor', 'lady pastor'],
      answer: 'Yes — women pastors are welcomed and celebrated in the Full Gospel Baptist Church Fellowship. God’s call knows no gender.'
    },
    {
      keywords: ['believe', 'beliefs', 'doctrine', 'full gospel', 'distinctives', 'theology', 'faith statement'],
      answer: 'We hold to historic Baptist doctrine together with a full embrace of the Holy Spirit’s ministry, including the gifts of the Spirit. Read our full statement of beliefs and the Full Gospel Distinctives on the <a href="about.html">About page</a>.'
    },
    {
      keywords: ['founded', 'founder', 'history', 'started', 'morton', 'began', '1994'],
      answer: 'The Full Gospel Baptist Church Fellowship International was founded in 1994 in New Orleans by Bishop Paul S. Morton, Sr. Learn more on our <a href="fellowship.html">Fellowship page</a>.'
    },
    {
      keywords: ['walker', 'international bishop', 'presiding bishop', 'international'],
      answer: 'Bishop Joseph W. Walker III is the International Presiding Bishop of the Full Gospel Baptist Church Fellowship International, leading since 2015.'
    },
    {
      keywords: ['pillars', 'faith family fitness finance', 'programs', 'ministries'],
      answer: 'The Fellowship equips churches through four pillars: <strong>Faith</strong> (Christian Education), <strong>Family</strong> (Marriage & Family Ministry), <strong>Fitness</strong> (Health & Wellness), and <strong>Finance</strong> (Economic Empowerment). See <a href="about.html">About</a> for details.'
    },
    {
      keywords: ['contact', 'phone', 'email', 'address', 'reach', 'office', 'get in touch'],
      answer: 'You can reach the North Texas State office through our <a href="contact.html">Contact page</a>, which includes a message form and State office details.'
    },
    {
      keywords: ['facebook', 'social media', 'instagram', 'follow'],
      answer: 'You can follow the North Texas State on <a href="https://www.facebook.com/share/1C45pA4J8P/" target="_blank" rel="noopener">Facebook</a>.'
    },
    {
      keywords: ['service time', 'service times', 'when do you meet', 'worship time', 'schedule', 'sunday'],
      answer: 'Service times vary by local church. Find a congregation near you in our <a href="churches.html">Church Directory</a> — each listing links to that church’s own website or Facebook page for their schedule.'
    },
    {
      keywords: ['event', 'events', 'conference', 'calendar', 'upcoming', 'propel'],
      answer: 'Upcoming conferences, retreats, and gatherings are featured in the Spotlight section of our <a href="index.html">Home page</a>.'
    },
    {
      keywords: ['who are you', 'what are you', 'are you real', 'human', 'bot', 'ai'],
      answer: 'I’m the North Texas State site assistant — a built-in helper trained on this website’s own content, not a live person. For anything I can’t answer, please reach out via the <a href="contact.html">Contact page</a>.'
    }
  ];

  const FALLBACK = 'I’m not sure about that one — but our <a href="faq.html">FAQ page</a> covers common questions, or you can reach the State office directly via <a href="contact.html">Contact</a>.';

  const SUGGESTIONS = [
    'How do I find a church?',
    'How can I give?',
    'Who is our Bishop?',
    'How do I join the Fellowship?'
  ];

  function bestAnswer(text) {
    const q = text.toLowerCase();
    let best = null, bestScore = 0;
    KB.forEach(entry => {
      let score = 0;
      entry.keywords.forEach(k => { if (q.includes(k)) score += k.split(' ').length; });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    return best ? best.answer : FALLBACK;
  }

  function init() {
    const root = document.getElementById('chatbot');
    const toggle = document.getElementById('chatbot-toggle');
    const panel = document.getElementById('chatbot-panel');
    const closeBtn = document.getElementById('chatbot-close');
    const messages = document.getElementById('chatbot-messages');
    const suggestionsWrap = document.getElementById('chatbot-suggestions');
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');
    if (!root || !toggle || !panel) return;

    let started = false;

    function addMessage(text, who, isHtml) {
      const div = document.createElement('div');
      div.className = 'chatbot-msg ' + who;
      if (isHtml) div.innerHTML = text; else div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function addSuggestions() {
      suggestionsWrap.innerHTML = '';
      SUGGESTIONS.forEach(s => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = s;
        btn.addEventListener('click', () => sendMessage(s));
        suggestionsWrap.appendChild(btn);
      });
    }

    function startConversation() {
      if (started) return;
      started = true;
      addMessage('Hi! I’m the North Texas State site assistant. Ask me about finding a church, giving, our leadership, or joining the Fellowship.', 'bot', true);
      addSuggestions();
    }

    function sendMessage(text) {
      const trimmed = text.trim();
      if (!trimmed) return;
      addMessage(trimmed, 'user', false);
      input.value = '';
      suggestionsWrap.innerHTML = '';
      const typing = document.createElement('div');
      typing.className = 'chatbot-msg bot typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;
      setTimeout(() => {
        typing.remove();
        addMessage(bestAnswer(trimmed), 'bot', true);
        addSuggestions();
      }, 450);
    }

    function openPanel() {
      root.classList.add('open');
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      startConversation();
      input.focus();
    }

    function closePanel() {
      root.classList.remove('open');
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
      if (panel.hidden) openPanel(); else closePanel();
    });
    closeBtn.addEventListener('click', closePanel);
    form.addEventListener('submit', e => {
      e.preventDefault();
      sendMessage(input.value);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
