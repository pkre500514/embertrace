# Devpost Submission Pack

Replace every `<PLACEHOLDER>` before submitting.

## Category

Choose **Productivity** if it is available in the event's category list. EmberTrace reduces the administrative reconstruction work that follows an incident while preserving human review and source traceability. If the event uses a different label, choose the closest category for **public-service workflow / productivity**.

## Project description

### English

EmberTrace is an evidence-grounded incident-report drafting demo for fire crews. After a fire, details are often scattered across helmet-camera footage, radio traffic, scene photos, dispatch records, and follow-up crew notes. Reconstructing that timeline by memory adds administrative load when crews should be recovering, training, or preparing for the next call.

The prototype cross-checks four simulated, de-identified evidence sources and produces a reviewable report draft. Every supported claim carries a link back to its source. Missing or unsupported information remains visibly marked for review instead of being guessed. Crew clarifications can be added as attributed evidence, and two human confirmation checks are required before the draft is marked ready for supervisor review. The browser also creates local SHA-256 fingerprints for the selected evidence, making the draft's inputs auditable.

EmberTrace runs entirely locally with no API key, account, upload, external model call, or real emergency-service data. It never auto-submits a report, determines origin or cause, or replaces agency policy. It is a demonstration of a safer pattern for AI-assisted public-safety documentation: evidence in, human judgment out.

### Korean

EmberTrace는 소방대원이 현장 이후 남은 근거 자료를 검토 가능한 보고서 초안으로 정리하도록 돕는 오프라인 데모입니다. 헬멧캠, 무전 전사, 현장 사진, 출동 기록, 대원 후속 메모를 교차확인하고, 초안의 각 주장에 출처를 연결합니다. 근거가 없는 내용은 추측하지 않고 `REVIEW REQUIRED`로 남기며, 최종 검토 전에는 사람의 확인 두 단계를 반드시 거치게 합니다. 선택된 원본 자료는 브라우저에서 SHA-256 지문으로 기록됩니다.

모든 사례와 자료는 가상·비식별이며, API 키·외부 AI 호출·실제 긴급 데이터·자동 제출을 사용하지 않습니다. EmberTrace는 화재 원인·발화 지점·의료 상태를 판단하지 않고, 기관 정책이나 사람의 결정을 대체하지 않습니다.

## How Codex and GPT-5.6 were used

Codex with GPT-5.6 accelerated the core workflow from concept to working demo:

1. Framed the product around a non-negotiable safety boundary: only evidence-supported drafting, never autonomous conclusions or submission.
2. Implemented the local evidence-selection, citation, review-required, language-toggle, and evidence-receipt flows.
3. Added a one-minute guided demo to make the judging path reproducible.
4. Added a dependency-free static server test and submission-ready documentation so judges can run the project without credentials.

The key product decision was to optimize for defensibility rather than fluent text generation. EmberTrace makes uncertainty obvious and keeps a human responsible for what becomes final.

## Demo video

- Public YouTube URL: `https://youtu.be/NIZqhmvuu4w`
- Recommended length: **3 minutes**
- Recording script: [DEMO_VIDEO_SCRIPT.md](./DEMO_VIDEO_SCRIPT.md)
- Required narration: explain the problem, show the full evidence-to-review flow, and state how Codex with GPT-5.6 was used.

## Repository and judge access

- Repository URL: `https://github.com/pkre500514/embertrace`
- Visibility: public, or private with these accounts invited: `testing@devpost.com` and `build-week-event@openai.com`
- License: MIT, included as `LICENSE`
- Run instructions and sample data: [README.md](./README.md)

## Codex feedback session

- `/feedback` session ID: `<CODEX-FEEDBACK-SESSION-ID>`

## Final submission checklist

- [ ] Select the closest available productivity/public-service category.
- [ ] Paste the English project description.
- [ ] Record and publish the 3-minute YouTube demo.
- [ ] Replace the YouTube URL, repository URL, and `/feedback` session ID.
- [ ] Push this folder to the repository.
- [ ] Confirm `npm start` and `npm test` pass from a clean checkout.
- [ ] If private, invite both required judge accounts.
