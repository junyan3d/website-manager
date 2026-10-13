---
layout: page
content-class: about-content
header-img: assets/covers/about.webp
title: 关于
description: 在数字空间里，探索形态与光影的可能。
permalink: /about/
---
<!-- Adapted for Website Manager (2026); original theme notices retained. -->
<p class="eyebrow">{{ site.data.profile.eyebrow | escape }}</p>
<h2>{{ site.data.profile.heading | escape }}</h2>
{{ site.data.profile.intro | markdownify }}
<h3>工作经历</h3>
{% for entry in site.data.profile.work %}<p><strong>{{ entry.title | escape }}</strong> <span class="timeline-date">{{ entry.date | escape }}</span></p>{{ entry.detail | markdownify }}{% endfor %}
<h3>教育经历</h3>
{% for entry in site.data.profile.education %}<p><strong>{{ entry.title | escape }}</strong> <span class="timeline-date">{{ entry.date | escape }}</span></p>{{ entry.detail | markdownify }}{% endfor %}
<h3>研究与技能</h3>
{{ site.data.profile.skills | markdownify }}
<h3>工作之外</h3>
{{ site.data.profile.interests | markdownify }}
<h3>联系我</h3>
<p><a href="mailto:{{ site.email | escape }}">{{ site.email | escape }}</a></p>
