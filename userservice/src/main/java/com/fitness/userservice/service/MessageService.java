package com.fitness.userservice.service;

import com.fitness.userservice.dto.MessageResponse;
import com.fitness.userservice.model.Message;
import com.fitness.userservice.model.TrainingRequest;
import com.fitness.userservice.model.TrainingRequestStatus;
import com.fitness.userservice.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final TrainingRequestService requestService;

    public MessageResponse send(String requestId, String senderId, String content) {
        TrainingRequest request = requestService.findForParticipant(requestId, senderId);
        if (request.getStatus() != TrainingRequestStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Coaching is not active");
        }
        Message message = new Message();
        message.setRequestId(requestId);
        message.setSenderId(senderId);
        message.setContent(content.trim());
        return toResponse(messageRepository.save(message));
    }

    public List<MessageResponse> list(String requestId, String userId, LocalDateTime after) {
        requestService.findForParticipant(requestId, userId);
        List<Message> messages = after == null
                ? messageRepository.findByRequestIdOrderByCreatedAtAsc(requestId)
                : messageRepository.findByRequestIdAndCreatedAtAfterOrderByCreatedAtAsc(requestId, after);
        return messages.stream().map(this::toResponse).toList();
    }

    private MessageResponse toResponse(Message message) {
        MessageResponse response = new MessageResponse();
        response.setId(message.getId());
        response.setSenderId(message.getSenderId());
        response.setContent(message.getContent());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }
}
